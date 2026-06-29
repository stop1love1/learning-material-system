import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FolderSchema } from './folder.schema';

// We test the REAL registered pre/post('save') hooks in isolation by extracting the
// callbacks Mongoose stored on the schema and invoking them with a hand-built `this`
// (a fake hydrated document) plus a fake Model on `this.constructor`. No live DB.
//
// Hook signatures (see folder.schema.ts):
//   pre('save')  uses: this.$locals, this.isModified('parentId'), this.parentId,
//                this._id, this.ancestors, this.depth, this.constructor (Model).
//   post('save') uses: this.$locals.parentChanged, this._id, this.ancestors,
//                this.constructor (Model).

// `timestamps: true` registers its OWN pre/post('save') hooks; select OUR cascade hook
// by matching on a token unique to its source (`parentChanged`), not by index.
function getHook(kind: '_pres' | '_posts'): (...args: any[]) => any {
  const hooks = (FolderSchema as any).s.hooks[kind].get('save');
  expect(hooks).toBeDefined();
  const match = hooks.find((h: any) => /parentChanged/.test(h.fn.toString()));
  expect(match).toBeDefined();
  return match.fn;
}

const preSave = getHook('_pres');
const postSave = getHook('_posts');

const oid = (hex: string) => new Types.ObjectId(hex);
const SELF = '5f00000000000000000000c1';
const PARENT = '5f00000000000000000000c2';
const GRAND = '5f00000000000000000000c3';

// A fake document whose `constructor` is the supplied model.
function makeDoc(props: {
  _id: string;
  parentId?: Types.ObjectId | null;
  ancestors?: Types.ObjectId[];
  depth?: number;
  modified: boolean;
  model: any;
}) {
  const doc: any = {
    _id: oid(props._id),
    parentId: props.parentId,
    ancestors: props.ancestors ?? [],
    depth: props.depth ?? 0,
    $locals: {},
    isModified: jest.fn().mockReturnValue(props.modified),
  };
  // `this.constructor` must be the model (the hook does `this.constructor as Model`).
  Object.defineProperty(doc, 'constructor', { value: props.model, enumerable: false });
  return doc;
}

// findById(...).select(...).lean() chain
function findByIdChain(resolved: any) {
  return { select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(resolved) };
}
// find(...).select(...).lean() chain
function findChain(resolved: any) {
  return { select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(resolved) };
}

describe('Folder schema save hooks (cycle guard + ancestors/depth)', () => {
  let model: any;

  beforeEach(() => {
    model = {
      findById: jest.fn(),
      exists: jest.fn(),
      find: jest.fn(),
      updateOne: jest.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => jest.resetAllMocks());

  describe("pre('save')", () => {
    it('records parentChanged=false and short-circuits when parentId unchanged', async () => {
      const doc = makeDoc({ _id: SELF, parentId: oid(PARENT), modified: false, model });
      await preSave.call(doc);
      expect(doc.$locals.parentChanged).toBe(false);
      expect(model.findById).not.toHaveBeenCalled();
    });

    it('moving to root (parentId null) resets ancestors=[] and depth=0', async () => {
      const doc = makeDoc({ _id: SELF, parentId: null, ancestors: [oid(PARENT)], depth: 3, modified: true, model });
      await preSave.call(doc);
      expect(doc.$locals.parentChanged).toBe(true);
      expect(doc.ancestors).toEqual([]);
      expect(doc.depth).toBe(0);
    });

    it('self-parent is rejected (BadRequest)', async () => {
      const doc = makeDoc({ _id: SELF, parentId: oid(SELF), modified: true, model });
      await expect(preSave.call(doc)).rejects.toBeInstanceOf(BadRequestException);
      expect(model.findById).not.toHaveBeenCalled();
    });

    it('missing parent → BadRequest', async () => {
      model.findById.mockReturnValue(findByIdChain(null));
      const doc = makeDoc({ _id: SELF, parentId: oid(PARENT), modified: true, model });
      await expect(preSave.call(doc)).rejects.toBeInstanceOf(BadRequestException);
    });

    it("cycle via parent's ancestors containing this node → BadRequest", async () => {
      // Proposed parent already has SELF in its ancestors → moving under it forms a cycle.
      model.findById.mockReturnValue(
        findByIdChain({ _id: oid(PARENT), ancestors: [oid(SELF)], depth: 5 }),
      );
      const doc = makeDoc({ _id: SELF, parentId: oid(PARENT), modified: true, model });
      await expect(preSave.call(doc)).rejects.toBeInstanceOf(BadRequestException);
      // Guarded before the DB descendant-existence probe.
      expect(model.exists).not.toHaveBeenCalled();
    });

    it('cycle detected via descendant existence probe → BadRequest', async () => {
      // Parent ancestors look clean, but a DB check finds the parent within this subtree.
      model.findById.mockReturnValue(findByIdChain({ _id: oid(PARENT), ancestors: [], depth: 0 }));
      model.exists.mockResolvedValue({ _id: oid(PARENT) });
      const doc = makeDoc({ _id: SELF, parentId: oid(PARENT), modified: true, model });
      await expect(preSave.call(doc)).rejects.toBeInstanceOf(BadRequestException);
      expect(model.exists).toHaveBeenCalledWith({ ancestors: doc._id, _id: doc.parentId });
    });

    it('valid move recomputes ancestors and depth from the parent', async () => {
      // parent under grandparent: parent.ancestors=[GRAND], depth=1 → child becomes
      // ancestors=[GRAND, PARENT], depth=2.
      model.findById.mockReturnValue(
        findByIdChain({ _id: oid(PARENT), ancestors: [oid(GRAND)], depth: 1 }),
      );
      model.exists.mockResolvedValue(null);
      const doc = makeDoc({ _id: SELF, parentId: oid(PARENT), modified: true, model });
      await preSave.call(doc);
      expect(doc.ancestors.map((a: Types.ObjectId) => a.toString())).toEqual([GRAND, PARENT]);
      expect(doc.depth).toBe(2);
      expect(doc.$locals.parentChanged).toBe(true);
    });

    it('move under a root parent yields ancestors=[parent], depth=1', async () => {
      model.findById.mockReturnValue(findByIdChain({ _id: oid(PARENT), ancestors: [], depth: 0 }));
      model.exists.mockResolvedValue(null);
      const doc = makeDoc({ _id: SELF, parentId: oid(PARENT), modified: true, model });
      await preSave.call(doc);
      expect(doc.ancestors.map((a: Types.ObjectId) => a.toString())).toEqual([PARENT]);
      expect(doc.depth).toBe(1);
    });
  });

  describe("post('save') descendant cascade", () => {
    it('does nothing when parentId did not change', async () => {
      const doc = makeDoc({ _id: SELF, modified: false, model });
      doc.$locals.parentChanged = false;
      await postSave.call(doc);
      expect(model.find).not.toHaveBeenCalled();
      expect(model.updateOne).not.toHaveBeenCalled();
    });

    it('recomputes ancestors/depth for every descendant, preserving the internal path tail', async () => {
      // This node now sits at ancestors=[GRAND], so baseAncestors=[GRAND, SELF].
      // A descendant whose OLD ancestors were [oldRoot, SELF, child] keeps the tail
      // after SELF ([child]) → new ancestors = [GRAND, SELF, child], depth=3.
      const child = oid('5f00000000000000000000d1');
      const oldRoot = oid('5f00000000000000000000d0');
      const descId = oid('5f00000000000000000000d2');
      const doc = makeDoc({ _id: SELF, ancestors: [oid(GRAND)], modified: true, model });
      doc.$locals.parentChanged = true;
      model.find.mockReturnValue(
        findChain([{ _id: descId, ancestors: [oldRoot, oid(SELF), child] }]),
      );

      await postSave.call(doc);

      expect(model.find).toHaveBeenCalledWith({ ancestors: doc._id });
      expect(model.updateOne).toHaveBeenCalledTimes(1);
      const [filter, update] = model.updateOne.mock.calls[0];
      expect(filter._id).toBe(descId);
      expect(update.ancestors.map((a: Types.ObjectId) => a.toString())).toEqual([GRAND, SELF, child.toString()]);
      expect(update.depth).toBe(3);
    });

    it('direct child (tail empty) → ancestors=[...base], depth=base length', async () => {
      const descId = oid('5f00000000000000000000d3');
      const doc = makeDoc({ _id: SELF, ancestors: [oid(GRAND)], modified: true, model });
      doc.$locals.parentChanged = true;
      // old ancestors end at SELF (no tail beyond it)
      model.find.mockReturnValue(findChain([{ _id: descId, ancestors: [oid(GRAND), oid(SELF)] }]));

      await postSave.call(doc);
      const [, update] = model.updateOne.mock.calls[0];
      expect(update.ancestors.map((a: Types.ObjectId) => a.toString())).toEqual([GRAND, SELF]);
      expect(update.depth).toBe(2);
    });

    it('issues one updateOne per descendant', async () => {
      const d1 = oid('5f00000000000000000000e1');
      const d2 = oid('5f00000000000000000000e2');
      const doc = makeDoc({ _id: SELF, ancestors: [], modified: true, model });
      doc.$locals.parentChanged = true;
      model.find.mockReturnValue(
        findChain([
          { _id: d1, ancestors: [oid(SELF)] },
          { _id: d2, ancestors: [oid(SELF)] },
        ]),
      );
      await postSave.call(doc);
      expect(model.updateOne).toHaveBeenCalledTimes(2);
    });
  });
});
