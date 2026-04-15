// Input validation is handled by the validate middleware, not the controller.
// Unit tests verify controller logic: service delegation, payload shaping, 404 handling.
jest.mock('../../../services/question.js');

const QuestionController = require('../../../controller/question');
const QuestionService = require('../../../services/question.js');

const makeReq = (body = {}, params = {}) => ({ body, params, query: {} });
const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('QuestionController', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('create', () => {
        const validBody = {
            productName: 'Laptop',
            productDescription: 'A great laptop',
            productImageUrl: 'https://img.example.com/laptop.png',
            isOrderIdTracking: true,
            questions: [{ type: 'SHORT', q: 'How was the product?' }],
        };

        it('should return 201 with created data on success', async () => {
            const created = { _id: 'q1', productName: 'Laptop' };
            QuestionService.create.mockResolvedValue(created);
            const res = makeRes();
            const next = jest.fn();

            await QuestionController.create(makeReq(validBody), res, next);

            expect(QuestionService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    productName: 'Laptop',
                    isOrderIdTracking: true,
                    questions: validBody.questions,
                })
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, data: created })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('should set reviewDate and null excelFile when isOrderIdTracking is true', async () => {
            QuestionService.create.mockResolvedValue({});
            const next = jest.fn();
            const body = { ...validBody, isOrderIdTracking: true, reviewDate: '2026-05-01' };

            await QuestionController.create(makeReq(body), makeRes(), next);

            expect(QuestionService.create).toHaveBeenCalledWith(
                expect.objectContaining({ reviewDate: '2026-05-01', excelFile: null })
            );
        });

        it('should set excelFile and null reviewDate when isOrderIdTracking is false', async () => {
            QuestionService.create.mockResolvedValue({});
            const next = jest.fn();
            const body = { ...validBody, isOrderIdTracking: false, excelFile: 'customers.xlsx' };

            await QuestionController.create(makeReq(body), makeRes(), next);

            expect(QuestionService.create).toHaveBeenCalledWith(
                expect.objectContaining({ excelFile: 'customers.xlsx', reviewDate: null })
            );
        });

        it('should call next if QuestionService.create throws', async () => {
            const dbError = new Error('DB error');
            QuestionService.create.mockRejectedValue(dbError);
            const next = jest.fn();

            await QuestionController.create(makeReq(validBody), makeRes(), next);

            expect(next).toHaveBeenCalledWith(dbError);
        });
    });

    describe('getById', () => {
        it('should call next with 404 if question set not found', async () => {
            QuestionService.getById.mockResolvedValue(null);
            const next = jest.fn();

            await QuestionController.getById(makeReq({}, { id: 'nonexistent' }), makeRes(), next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
        });

        it('should return 200 with isOrderIdTracking and questions on success', async () => {
            const questionSet = {
                isOrderIdTracking: true,
                questions: [{ type: 'SHORT', q: 'Q1' }],
            };
            QuestionService.getById.mockResolvedValue(questionSet);
            const res = makeRes();
            const next = jest.fn();

            await QuestionController.getById(makeReq({}, { id: 'q1' }), res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        isOrderIdTracking: true,
                        questions: questionSet.questions,
                    }),
                })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });
});
