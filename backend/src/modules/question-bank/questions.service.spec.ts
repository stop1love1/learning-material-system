import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { QuestionsService } from './questions.service';
import { Question } from '../../schemas/question-bank/question.schema';
import { Topic } from '../../schemas/question-bank/topic.schema';
import { SingleChoiceQuestion } from '../../schemas/question-bank/single-choice-question.schema';
import { MultipleChoiceQuestion } from '../../schemas/question-bank/multiple-choice-question.schema';
import { TrueFalseQuestion } from '../../schemas/question-bank/true-false-question.schema';
import { ShortAnswerQuestion } from '../../schemas/question-bank/short-answer-question.schema';
import { EssayQuestion } from '../../schemas/question-bank/essay-question.schema';
import { MatchQuestion } from '../../schemas/question-bank/match-question.schema';
import { NumberQuestion } from '../../schemas/question-bank/number-question.schema';
import { SortQuestion } from '../../schemas/question-bank/sort-question.schema';
import { TableSelectionQuestion } from '../../schemas/question-bank/table-selection-question.schema';
import { QuestionModel, QuestionType, UserRole } from '../../enums';


// convertStringToObjectId() validates with mongoose, so ids MUST be valid hex.
const oid = () => new Types.ObjectId().toHexString();

// A chainable query stub: every chain method returns `this`, and the chain is
// resolved either via .lean()/.exec() or by awaiting (countDocuments).
function queryStub(result: any) {
  const q: any = {
    sort: jest.fn(() => q),
    skip: jest.fn(() => q),
    limit: jest.fn(() => q),
    populate: jest.fn(() => q),
    lean: jest.fn(() => Promise.resolve(result)),
    exec: jest.fn(() => Promise.resolve(result)),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return q;
}

// A detail-model mock: create + findById + findByIdAndUpdate + deleteOne, and a
// `schema.paths` so pickDetailFields() can enumerate own fields.
function makeDetailModel(paths: string[] = ['content', 'options', 'correctIndex']) {
  const schemaPaths: Record<string, any> = { _id: {}, questionId: {}, createdAt: {}, updatedAt: {} };
  for (const p of paths) schemaPaths[p] = {};
  return {
    schema: { paths: schemaPaths },
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  };
}

// A saved base document: behaves like a Mongoose doc (has _id, fields, save()).
function makeBaseDoc(overrides: Record<string, any> = {}) {
  const doc: any = {
    _id: new Types.ObjectId(),
    type: QuestionType.Single,
    questionModel: QuestionModel.SingleChoice,
    questionDetail: new Types.ObjectId(),
    ...overrides,
  };
  doc.save = jest.fn(() => Promise.resolve(doc));
  return doc;
}

describe('QuestionsService', () => {
  let service: QuestionsService;
  let questionModel: any;
  let topicModel: any;
  let detailModels: Record<string, ReturnType<typeof makeDetailModel>>;

  // map QuestionType -> the schema class whose token holds the detail model
  const detailClassByType = {
    [QuestionType.Single]: SingleChoiceQuestion,
    [QuestionType.Multi]: MultipleChoiceQuestion,
    [QuestionType.TrueFalse]: TrueFalseQuestion,
    [QuestionType.Fill]: ShortAnswerQuestion,
    [QuestionType.Essay]: EssayQuestion,
    [QuestionType.Match]: MatchQuestion,
    [QuestionType.Number]: NumberQuestion,
    [QuestionType.Sort]: SortQuestion,
    [QuestionType.TableSelection]: TableSelectionQuestion,
  } as const;

  beforeEach(async () => {
    questionModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
      deleteOne: jest.fn(),
    };
    topicModel = { find: jest.fn(), countDocuments: jest.fn() };

    detailModels = {};
    const detailProviders = Object.values(detailClassByType).map((cls) => {
      const m = makeDetailModel();
      detailModels[cls.name] = m;
      return { provide: getModelToken(cls.name), useValue: m };
    });

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: getModelToken(Question.name), useValue: questionModel },
        { provide: getModelToken(Topic.name), useValue: topicModel },
        ...detailProviders,
      ],
    }).compile();

    service = moduleRef.get(QuestionsService);
  });

  afterEach(() => jest.clearAllMocks());

  // -- create ----------------------------------------------------------------

  describe('create', () => {
    it('writes base + the correct per-type detail and back-links questionModel/questionDetail', async () => {
      const userId = oid();
      const base = makeBaseDoc({ questionModel: undefined, questionDetail: undefined });
      const detailDoc = { _id: new Types.ObjectId(), toObject: () => ({ _id: 'detail', content: 'opt' }) };

      questionModel.create.mockResolvedValue(base);
      detailModels[SingleChoiceQuestion.name].create.mockResolvedValue(detailDoc);
      questionModel.findById.mockReturnValue(queryStub({ _id: base._id, linked: true }));

      const res = await service.create(userId, {
        type: QuestionType.Single,
        content: 'Câu hỏi',
        detail: { options: ['a', 'b'], correctIndex: 0 },
      } as any);

      // base created
      expect(questionModel.create).toHaveBeenCalledTimes(1);
      // detail created in the SingleChoice collection, linked to base._id
      expect(detailModels[SingleChoiceQuestion.name].create).toHaveBeenCalledWith(
        expect.objectContaining({ questionId: base._id, options: ['a', 'b'], correctIndex: 0 }),
      );
      // NO other detail model was written
      expect(detailModels[EssayQuestion.name].create).not.toHaveBeenCalled();
      // back-link written + saved
      expect(base.questionModel).toBe(QuestionModel.SingleChoice);
      expect(base.questionDetail).toBe(detailDoc._id);
      expect(base.save).toHaveBeenCalledTimes(1);
      expect(res.detail).toEqual({ _id: 'detail', content: 'opt' });
    });

    it.each([
      [QuestionType.Essay, EssayQuestion, QuestionModel.Essay],
      [QuestionType.Match, MatchQuestion, QuestionModel.Match],
      [QuestionType.TableSelection, TableSelectionQuestion, QuestionModel.TableSelection],
    ])('routes %s to the right detail collection', async (type, cls, qm) => {
      const base = makeBaseDoc({ questionModel: undefined, questionDetail: undefined });
      const detailDoc = { _id: new Types.ObjectId(), toObject: () => ({}) };
      questionModel.create.mockResolvedValue(base);
      detailModels[cls.name].create.mockResolvedValue(detailDoc);
      questionModel.findById.mockReturnValue(queryStub({}));

      await service.create(oid(), { type, content: 'x', detail: {} } as any);

      expect(detailModels[cls.name].create).toHaveBeenCalledTimes(1);
      expect(base.questionModel).toBe(qm);
    });

    it('cleans up the orphan base row and re-throws when detail creation fails', async () => {
      const base = makeBaseDoc({ questionModel: undefined, questionDetail: undefined });
      const boom = new Error('detail validation failed');
      questionModel.create.mockResolvedValue(base);
      detailModels[SingleChoiceQuestion.name].create.mockRejectedValue(boom);
      questionModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await expect(
        service.create(oid(), { type: QuestionType.Single, content: 'x', detail: {} } as any),
      ).rejects.toBe(boom); // ORIGINAL error re-thrown

      // orphan base deleted by _id
      expect(questionModel.deleteOne).toHaveBeenCalledWith({ _id: base._id });
      // never linked / saved
      expect(base.save).not.toHaveBeenCalled();
    });

    it('throws BadRequest (not NotFound) for an invalid type', async () => {
      const base = makeBaseDoc();
      questionModel.create.mockResolvedValue(base);

      await expect(
        service.create(oid(), { type: 'nope' as any, content: 'x', detail: {} } as any),
      ).rejects.toBeInstanceOf(BadRequestException);

      // resolveDetail throws before any detail write
      for (const m of Object.values(detailModels)) expect(m.create).not.toHaveBeenCalled();
    });
  });

  // -- findOne ---------------------------------------------------------------

  describe('findOne', () => {
    it('scopes a non-owner teacher to their own questions (owner filter applied)', async () => {
      const id = oid();
      const userId = oid();
      questionModel.findOne.mockReturnValue(queryStub(null)); // not found under owner filter

      await expect(service.findOne(id, userId, UserRole.Teacher)).rejects.toBeInstanceOf(NotFoundException);

      const filter = questionModel.findOne.mock.calls[0][0];
      expect(filter).toHaveProperty('userId'); // owner-scoped
      expect(filter._id).toBeInstanceOf(Types.ObjectId);
    });

    it('does not owner-scope for Admin', async () => {
      const id = oid();
      questionModel.findOne.mockReturnValue(
        queryStub({ _id: id, questionModel: QuestionModel.Essay, questionDetail: oid() }),
      );
      detailModels[EssayQuestion.name].findById.mockReturnValue(queryStub({ _id: 'd' }));

      const res = await service.findOne(id, oid(), UserRole.Admin);

      const filter = questionModel.findOne.mock.calls[0][0];
      expect(filter).not.toHaveProperty('userId'); // Admin sees all
      expect(res.detail).toEqual({ _id: 'd' });
      expect(detailModels[EssayQuestion.name].findById).toHaveBeenCalled();
    });

    it('returns question + detail loaded from the matching detail collection', async () => {
      const detailId = oid();
      questionModel.findOne.mockReturnValue(
        queryStub({ _id: oid(), questionModel: QuestionModel.Match, questionDetail: detailId }),
      );
      detailModels[MatchQuestion.name].findById.mockReturnValue(queryStub({ _id: detailId, pairs: [] }));

      const res = await service.findOne(oid(), oid(), UserRole.Teacher);

      expect(detailModels[MatchQuestion.name].findById).toHaveBeenCalledWith(detailId);
      expect(res.detail).toEqual({ _id: detailId, pairs: [] });
    });
  });

  // -- list ------------------------------------------------------------------

  describe('list', () => {
    it('paginates and does not crash on a regex-metachar keyword', async () => {
      questionModel.find.mockReturnValue(queryStub([{ _id: '1' }]));
      questionModel.countDocuments.mockResolvedValue(1);

      const res = await service.list(oid(), { keyword: 'a.*+?(x)[y]\\z', page: 1, pageSize: 10 } as any);

      expect(res.total).toBe(1);
      expect(res.records).toEqual([{ _id: '1' }]);

      // the $regex value must be the ESCAPED keyword (parseKeyword), so no throw
      const query = questionModel.find.mock.calls[0][0];
      const regex = query.$or[0].title.$regex;
      // backslash-escaped metachars present, literal-safe
      expect(regex).toContain('\\.');
      expect(() => new RegExp(regex)).not.toThrow();
    });

    it('omits the $or block when there is no keyword', async () => {
      questionModel.find.mockReturnValue(queryStub([]));
      questionModel.countDocuments.mockResolvedValue(0);

      await service.list(oid(), { page: 1, pageSize: 10 } as any);
      const query = questionModel.find.mock.calls[0][0];
      expect(query.$or).toBeUndefined();
      expect(query).toHaveProperty('userId');
    });
  });

  // -- update ----------------------------------------------------------------

  describe('update (same type)', () => {
    it('updates the existing detail with runValidators and a field-restricted $set', async () => {
      const base = makeBaseDoc({ type: QuestionType.Single, questionModel: QuestionModel.SingleChoice });
      questionModel.findOne.mockReturnValue(base); // findOne(...) returns a doc (no .lean in update path)
      detailModels[SingleChoiceQuestion.name].findById.mockReturnValue(queryStub({ _id: 'd', content: 'old' }));
      detailModels[SingleChoiceQuestion.name].findByIdAndUpdate.mockReturnValue(queryStub({ _id: 'd', content: 'new' }));
      questionModel.findById.mockReturnValue(queryStub({ _id: base._id }));

      const res = await service.update(
        oid(),
        { detail: { content: 'new', options: ['a'], junk: 'DROP ME' } } as any,
        oid(),
        UserRole.Teacher,
      );

      expect(base.save).toHaveBeenCalledTimes(1);
      // SAME collection updated, NOT migrated
      const [updId, payload, opts] = detailModels[SingleChoiceQuestion.name].findByIdAndUpdate.mock.calls[0];
      expect(updId).toBe(base.questionDetail);
      expect(opts).toEqual({ new: true, runValidators: true });
      // $set restricted to schema-own fields; arbitrary "junk" stripped
      expect(payload.$set).toHaveProperty('content', 'new');
      expect(payload.$set).toHaveProperty('options', ['a']);
      expect(payload.$set).not.toHaveProperty('junk');
      // no detail was deleted (no migration)
      expect(detailModels[SingleChoiceQuestion.name].deleteOne).not.toHaveBeenCalled();
      expect(res.detail).toEqual({ _id: 'd', content: 'new' });
    });

    it('saves base without touching detail when dto.detail is omitted', async () => {
      const base = makeBaseDoc({ type: QuestionType.Single, questionModel: QuestionModel.SingleChoice });
      questionModel.findOne.mockReturnValue(base);
      detailModels[SingleChoiceQuestion.name].findById.mockReturnValue(queryStub({ _id: 'd' }));
      questionModel.findById.mockReturnValue(queryStub({ _id: base._id }));

      await service.update(oid(), { title: 'New title' } as any, oid(), UserRole.Teacher);

      expect(base.save).toHaveBeenCalledTimes(1);
      expect(detailModels[SingleChoiceQuestion.name].findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('update (changed type) — migration', () => {
    it('creates the new detail in the new collection, deletes the old, and re-links — without corruption', async () => {
      const oldDetailId = new Types.ObjectId();
      const base = makeBaseDoc({
        type: QuestionType.Single,
        questionModel: QuestionModel.SingleChoice,
        questionDetail: oldDetailId,
      });
      const newDetail = { _id: new Types.ObjectId(), toObject: () => ({ _id: 'new', essay: true }) };

      questionModel.findOne.mockReturnValue(base);
      detailModels[EssayQuestion.name].create.mockResolvedValue(newDetail);
      detailModels[SingleChoiceQuestion.name].deleteOne.mockResolvedValue({ deletedCount: 1 });
      questionModel.findById.mockReturnValue(queryStub({ _id: base._id }));

      const res = await service.update(
        oid(),
        { type: QuestionType.Essay, detail: { gradingType: 'manual' } } as any,
        oid(),
        UserRole.Teacher,
      );

      // new detail created in the ESSAY collection, linked to base._id
      expect(detailModels[EssayQuestion.name].create).toHaveBeenCalledWith(
        expect.objectContaining({ questionId: base._id, gradingType: 'manual' }),
      );
      // OLD detail deleted from the SingleChoice collection, by old id
      expect(detailModels[SingleChoiceQuestion.name].deleteOne).toHaveBeenCalledWith({ _id: oldDetailId });
      // re-linked + saved
      expect(base.questionModel).toBe(QuestionModel.Essay);
      expect(base.questionDetail).toBe(newDetail._id);
      expect(base.type).toBe(QuestionType.Essay);
      expect(base.save).toHaveBeenCalledTimes(1);
      // existing detail in old collection NOT update-merged
      expect(detailModels[SingleChoiceQuestion.name].findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.detail).toEqual({ _id: 'new', essay: true });
    });

    it('creates the new detail before deleting the old (migration order)', async () => {
      const order: string[] = [];
      const oldDetailId = new Types.ObjectId();
      const base = makeBaseDoc({
        type: QuestionType.Single,
        questionModel: QuestionModel.SingleChoice,
        questionDetail: oldDetailId,
      });
      questionModel.findOne.mockReturnValue(base);
      detailModels[MatchQuestion.name].create.mockImplementation(async () => {
        order.push('create-new');
        return { _id: new Types.ObjectId(), toObject: () => ({}) };
      });
      detailModels[SingleChoiceQuestion.name].deleteOne.mockImplementation(async () => {
        order.push('delete-old');
        return { deletedCount: 1 };
      });
      questionModel.findById.mockReturnValue(queryStub({}));

      await service.update(oid(), { type: QuestionType.Match, detail: {} } as any, oid(), UserRole.Teacher);

      expect(order).toEqual(['create-new', 'delete-old']);
    });

    it('throws NotFound when the base question is not found (owner-scoped miss)', async () => {
      questionModel.findOne.mockReturnValue(null);
      await expect(
        service.update(oid(), { title: 'x' } as any, oid(), UserRole.Teacher),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // -- remove ----------------------------------------------------------------

  describe('remove', () => {
    it('deletes the detail then the base', async () => {
      const detailId = new Types.ObjectId();
      questionModel.findOne.mockReturnValue(
        queryStub({ _id: oid(), questionModel: QuestionModel.Sort, questionDetail: detailId }),
      );
      detailModels[SortQuestion.name].deleteOne.mockResolvedValue({ deletedCount: 1 });
      questionModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const res = await service.remove(oid(), oid(), UserRole.Admin);

      expect(detailModels[SortQuestion.name].deleteOne).toHaveBeenCalledWith({ _id: detailId });
      expect(questionModel.deleteOne).toHaveBeenCalled();
      expect(res).toEqual({ deleted: true });
    });
  });
});
