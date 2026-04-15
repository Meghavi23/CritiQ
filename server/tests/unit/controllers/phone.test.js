jest.mock('../../../services/phone.js');

const PhoneController = require('../../../controller/phone');
const PhoneService = require('../../../services/phone.js');

const makeReq = (body = {}, query = {}) => ({ body, params: {}, query });
const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('PhoneController', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('create', () => {
        it('should call next with 400 if phone is missing', async () => {
            const next = jest.fn();
            await PhoneController.create(makeReq({ sid: 1, id: 1 }), makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        });

        it('should call next with 400 if sid is missing', async () => {
            const next = jest.fn();
            await PhoneController.create(makeReq({ phone: '9876543210', id: 1 }), makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        });

        it('should call next with 400 if id is missing', async () => {
            const next = jest.fn();
            await PhoneController.create(makeReq({ phone: '9876543210', sid: 42 }), makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        });

        it('should call PhoneService.create and return 200 on success', async () => {
            PhoneService.create.mockResolvedValue({});
            const res = makeRes();
            const next = jest.fn();

            await PhoneController.create(
                makeReq({ phone: '9876543210', sid: 42, id: 1 }),
                res,
                next
            );

            expect(PhoneService.create).toHaveBeenCalledWith({ phone: '9876543210', sid: 42, id: 1 });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, message: expect.any(String) })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('getOne', () => {
        it('should call next with 404 if phone not found', async () => {
            PhoneService.getOne.mockResolvedValue(null);
            const next = jest.fn();

            await PhoneController.getOne(makeReq({}, { phone: '0000000000' }), makeRes(), next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
        });

        it('should return 200 with phone data when found', async () => {
            const phoneRecord = { phone: '9876543210', sid: 42, id: 1 };
            PhoneService.getOne.mockResolvedValue(phoneRecord);
            const res = makeRes();
            const next = jest.fn();

            await PhoneController.getOne(makeReq({}, { phone: '9876543210' }), res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, data: phoneRecord })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });
});
