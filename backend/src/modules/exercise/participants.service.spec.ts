import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ParticipantsService } from './participants.service';
import { Participant } from '../../schemas/exercise/participant.schema';
import { Attempt } from '../../schemas/exercise/attempt.schema';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { User } from '../../schemas/user.schema';
import { UserRole } from '../../enums';

const oid = () => new Types.ObjectId().toHexString();

// chainable mock resolving at .lean()
function chain(value: any) {
  const c: any = {};
  c.select = jest.fn(() => c);
  c.populate = jest.fn(() => c);
  c.sort = jest.fn(() => c);
  c.skip = jest.fn(() => c);
  c.limit = jest.fn(() => c);
  c.lean = jest.fn(() => Promise.resolve(value));
  return c;
}

describe('ParticipantsService', () => {
  let service: ParticipantsService;
  let participantModel: any;
  let attemptModel: any;
  let exerciseModel: any;
  let userModel: any;

  const OWNER_ID = oid();
  const OTHER_ID = oid();
  const PARTICIPANT_ID = oid();
  const ATTEMPT_ID = oid();
  const EXERCISE_ID = oid();

  beforeEach(async () => {
    jest.clearAllMocks();
    participantModel = {
      findById: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    attemptModel = { findById: jest.fn(), find: jest.fn() };
    exerciseModel = { findById: jest.fn(), find: jest.fn() };
    userModel = { find: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantsService,
        { provide: getModelToken(Participant.name), useValue: participantModel },
        { provide: getModelToken(Attempt.name), useValue: attemptModel },
        { provide: getModelToken(Exercise.name), useValue: exerciseModel },
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = moduleRef.get(ParticipantsService);
  });

  // assertOwnership resolves participant -> attempt -> exercise.userId
  function wireOwnership(exerciseUserId: string | null) {
    attemptModel.findById.mockReturnValue(
      chain({ exerciseId: new Types.ObjectId(EXERCISE_ID) }),
    );
    exerciseModel.findById.mockReturnValue(
      chain(exerciseUserId ? { userId: new Types.ObjectId(exerciseUserId) } : null),
    );
  }

  describe('findOne owner-scoping', () => {
    it('throws NotFound when participant missing', async () => {
      participantModel.findById.mockReturnValue(chain(null));
      await expect(
        service.findOne(PARTICIPANT_ID, OWNER_ID, UserRole.Teacher),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns participant when caller owns the exercise', async () => {
      const participant = { _id: PARTICIPANT_ID, attemptId: new Types.ObjectId(ATTEMPT_ID) };
      participantModel.findById.mockReturnValue(chain(participant));
      wireOwnership(OWNER_ID);
      await expect(
        service.findOne(PARTICIPANT_ID, OWNER_ID, UserRole.Teacher),
      ).resolves.toBe(participant);
    });

    it('throws Forbidden when caller does NOT own the exercise', async () => {
      participantModel.findById.mockReturnValue(
        chain({ _id: PARTICIPANT_ID, attemptId: new Types.ObjectId(ATTEMPT_ID) }),
      );
      wireOwnership(OTHER_ID); // exercise owned by someone else
      await expect(
        service.findOne(PARTICIPANT_ID, OWNER_ID, UserRole.Teacher),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Admin bypasses ownership check', async () => {
      const participant = { _id: PARTICIPANT_ID, attemptId: new Types.ObjectId(ATTEMPT_ID) };
      participantModel.findById.mockReturnValue(chain(participant));
      await expect(
        service.findOne(PARTICIPANT_ID, OWNER_ID, UserRole.Admin),
      ).resolves.toBe(participant);
      // never resolved attempt/exercise because Admin short-circuits
      expect(attemptModel.findById).not.toHaveBeenCalled();
    });
  });

  describe('update owner-scoping', () => {
    it('throws NotFound when participant missing', async () => {
      participantModel.findById.mockReturnValue(chain(null));
      await expect(
        service.update(PARTICIPANT_ID, { isBanned: true } as any, OWNER_ID, UserRole.Teacher),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden before mutating when caller does not own the exercise', async () => {
      participantModel.findById.mockReturnValue(
        chain({ attemptId: new Types.ObjectId(ATTEMPT_ID) }),
      );
      wireOwnership(OTHER_ID);
      await expect(
        service.update(PARTICIPANT_ID, { isBanned: true } as any, OWNER_ID, UserRole.Teacher),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(participantModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('applies patch (isBanned) and sets endedAt when isFinished=true for an owner', async () => {
      participantModel.findById.mockReturnValue(
        chain({ attemptId: new Types.ObjectId(ATTEMPT_ID) }),
      );
      wireOwnership(OWNER_ID);
      const updated = { _id: PARTICIPANT_ID, isFinished: true };
      participantModel.findByIdAndUpdate.mockReturnValue(chain(updated));

      const res = await service.update(
        PARTICIPANT_ID,
        { isBanned: true, isFinished: true } as any,
        OWNER_ID,
        UserRole.Teacher,
      );
      expect(res).toBe(updated);
      const patch = participantModel.findByIdAndUpdate.mock.calls[0][1];
      expect(patch.isBanned).toBe(true);
      expect(patch.isFinished).toBe(true);
      expect(patch.endedAt).toBeInstanceOf(Date);
    });
  });

  describe('list owner-scoping', () => {
    it('restricts a teacher to exercises they own (adds userId to exercise filter)', async () => {
      exerciseModel.find.mockReturnValue(chain([{ _id: new Types.ObjectId(EXERCISE_ID) }]));
      attemptModel.find.mockReturnValue(chain([{ _id: new Types.ObjectId(ATTEMPT_ID) }]));
      participantModel.find.mockReturnValue(chain([]));
      participantModel.countDocuments.mockResolvedValue(0);

      await service.list({} as any, OWNER_ID, UserRole.Teacher);

      const exerciseFilter = exerciseModel.find.mock.calls[0][0];
      expect(exerciseFilter.userId.toString()).toBe(OWNER_ID);
      // participant query constrained to attempts from owned exercises
      const participantFilter = participantModel.find.mock.calls[0][0];
      expect(participantFilter.attemptId).toBeDefined();
      expect(participantFilter.attemptId.$in).toHaveLength(1);
    });

    it('Admin without exerciseId is NOT constrained by ownership', async () => {
      participantModel.find.mockReturnValue(chain([]));
      participantModel.countDocuments.mockResolvedValue(0);

      await service.list({} as any, OWNER_ID, UserRole.Admin);

      // No exercise/attempt resolution needed when admin and no exerciseId filter
      expect(exerciseModel.find).not.toHaveBeenCalled();
      const participantFilter = participantModel.find.mock.calls[0][0];
      expect(participantFilter.attemptId).toBeUndefined();
    });
  });
});
