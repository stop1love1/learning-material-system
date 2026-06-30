import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { SettingsService } from './settings.service';
import { Settings } from '../../schemas/settings.schema';
import { Folder } from '../../schemas/library/folder.schema';
import { FileItem } from '../../schemas/library/file.schema';
import { Article } from '../../schemas/article.schema';
import { Topic } from '../../schemas/question-bank/topic.schema';
import { Rubric } from '../../schemas/rubric/rubric.schema';

// The full set of default groups the service backfills.
const DEFAULT_GROUPS: any = {
  org: { name: 'Vườn Văn' },
  appearance: {},
  misc: {},
  homepage: {},
  seo: {},
  academic: {},
  security: {},
  notifications: {},
  integration: { apiKey: 'SECRET-KEY' },
  data: {},
};

describe('SettingsService', () => {
  let service: SettingsService;
  let settingsModel: any;
  let folderModel: any;
  let fileModel: any;
  let articleModel: any;
  let topicModel: any;
  let rubricModel: any;

  const makeSimpleModel = () => ({ find: jest.fn(), updateOne: jest.fn() });

  beforeEach(async () => {
    // settingsModel is BOTH a constructor (new settingsModel({key})) and has statics.
    // The constructed instance is used only to obtain `toObject()` defaults.
    settingsModel = jest.fn().mockImplementation(() => ({
      toObject: () => JSON.parse(JSON.stringify(DEFAULT_GROUPS)),
    }));
    settingsModel.findOne = jest.fn();
    settingsModel.create = jest.fn();
    settingsModel.findOneAndUpdate = jest.fn();

    folderModel = makeSimpleModel();
    fileModel = makeSimpleModel();
    articleModel = makeSimpleModel();
    topicModel = makeSimpleModel();
    rubricModel = makeSimpleModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getModelToken(Settings.name), useValue: settingsModel },
        { provide: getModelToken(Folder.name), useValue: folderModel },
        { provide: getModelToken(FileItem.name), useValue: fileModel },
        { provide: getModelToken(Article.name), useValue: articleModel },
        { provide: getModelToken(Topic.name), useValue: topicModel },
        { provide: getModelToken(Rubric.name), useValue: rubricModel },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getOrCreate', () => {
    it('creates the singleton when missing', async () => {
      settingsModel.findOne.mockResolvedValue(null);
      // created doc has all groups so no backfill/save happens; toObject deep-clones.
      const stored = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
      const saved: any = {
        ...stored,
        save: jest.fn(),
        toObject: () => JSON.parse(JSON.stringify(stored)),
      };
      settingsModel.create.mockResolvedValue(saved);

      await service.getOrCreate();
      expect(settingsModel.create).toHaveBeenCalledWith({ key: 'system' });
    });

    it('backfills missing groups from defaults and saves', async () => {
      const doc: any = {
        org: { name: 'Existing' },
        integration: { apiKey: 'SECRET-KEY' },
        // all other groups are missing → must be backfilled
        save: jest.fn().mockResolvedValue(undefined),
        toObject() {
          // reflect whatever was assigned onto the doc
          const { save, toObject, ...rest } = this;
          return JSON.parse(JSON.stringify(rest));
        },
      };
      settingsModel.findOne.mockResolvedValue(doc);

      const result = await service.getOrCreate();

      expect(doc.save).toHaveBeenCalled();
      // a previously-missing group is now present
      expect(result.academic).toBeDefined();
      expect(result.org).toEqual({ name: 'Existing' });
    });

    it('redacts integration.apiKey on the returned copy (without touching the stored doc)', async () => {
      const stored = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
      const doc: any = {
        ...stored,
        save: jest.fn(),
        // toObject() returns a fresh deep copy, mirroring Mongoose semantics.
        toObject: () => JSON.parse(JSON.stringify(stored)),
      };
      settingsModel.findOne.mockResolvedValue(doc);

      const result = await service.getOrCreate();

      expect(result.integration.apiKey).toBeNull();
      // stored doc keeps the real secret (redaction only on the returned copy)
      expect(stored.integration.apiKey).toBe('SECRET-KEY');
    });
  });

  describe('update', () => {
    it('flattens known groups into dot-paths and upserts', async () => {
      settingsModel.findOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ ok: true }) });

      await service.update({
        org: { name: 'Vườn Văn', logo: 'x.png' },
        integration: { apiKey: 'NEW' },
        // unknown group must be ignored
        bogus: { foo: 1 },
      } as any);

      const [filter, update, opts] = settingsModel.findOneAndUpdate.mock.calls[0];
      expect(filter).toEqual({ key: 'system' });
      expect(opts).toMatchObject({ upsert: true, new: true });
      expect(update.$set).toEqual({
        'org.name': 'Vườn Văn',
        'org.logo': 'x.png',
        'integration.apiKey': 'NEW',
      });
      expect(Object.keys(update.$set).some((k) => k.startsWith('bogus'))).toBe(false);
    });
  });

  describe('exportBackup', () => {
    it('reads all backup collections into a versioned snapshot', async () => {
      for (const m of [folderModel, fileModel, articleModel, topicModel, rubricModel]) {
        m.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: '1' }]) });
      }

      const snap = await service.exportBackup();

      expect(snap.version).toBe(1);
      expect(typeof snap.exportedAt).toBe('string');
      expect(Object.keys(snap.collections)).toEqual(['folders', 'files', 'articles', 'topics', 'rubrics']);
      expect(snap.collections.folders).toEqual([{ _id: '1' }]);
    });
  });

  describe('importBackup', () => {
    it('rejects an invalid snapshot', async () => {
      await expect(service.importBackup(null)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.importBackup({})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('upserts rows by _id and skips rows with invalid/missing _id', async () => {
      fileModel.updateOne.mockResolvedValue({});
      const validId = new Types.ObjectId().toString();

      const res = await service.importBackup({
        collections: {
          files: [
            { _id: validId, name: 'ok' },
            { _id: 'not-an-objectid', name: 'bad' }, // skipped
            { name: 'no-id' }, // skipped
          ],
          folders: 'not-an-array', // skipped entirely
        },
      });

      expect(fileModel.updateOne).toHaveBeenCalledTimes(1);
      expect(fileModel.updateOne).toHaveBeenCalledWith(
        { _id: validId },
        { $set: { name: 'ok' } },
        { upsert: true },
      );
      expect(res.ok).toBe(true);
      expect(res.restored.files).toBe(1);
      expect(res.restored.folders).toBeUndefined();
    });
  });
});
