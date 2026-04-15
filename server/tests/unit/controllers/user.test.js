jest.mock('../../../services/user.js');

const UserController = require('../../../controller/user');
const UserService = require('../../../services/user.js');

const makeReq = (body = {}) => ({ body, params: {}, query: {} });
const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('UserController', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('create', () => {
        const validBody = {
            companyName: 'TestCo',
            companyEmail: 'test@testco.com',
            walletAddress: 'GABC123XYZ',
            companyDescription: 'A test company',
            companyLogoUrl: 'https://img.example.com/logo.png',
        };

        it('should call next with 400 if any required field is missing', async () => {
            const next = jest.fn();
            await UserController.create(makeReq({ companyName: 'TestCo' }), makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        });

        it('should call UserService.create with the correct payload', async () => {
            UserService.create.mockResolvedValue({});
            const res = makeRes();
            const next = jest.fn();

            await UserController.create(makeReq(validBody), res, next);

            expect(UserService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'TestCo',
                    email: 'test@testco.com',
                    walletAddress: 'GABC123XYZ',
                    imageUrl: 'https://img.example.com/logo.png',
                    description: 'A test company',
                })
            );
        });

        it('should return 201 with success shape on valid input', async () => {
            UserService.create.mockResolvedValue({});
            const res = makeRes();
            const next = jest.fn();

            await UserController.create(makeReq(validBody), res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, message: expect.any(String) })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next with the service error if UserService.create rejects', async () => {
            const serviceError = new Error('DB error');
            UserService.create.mockRejectedValue(serviceError);
            const next = jest.fn();

            await UserController.create(makeReq(validBody), makeRes(), next);

            expect(next).toHaveBeenCalledWith(serviceError);
        });
    });

    describe('login', () => {
        it('should call next with 400 if walletAddress is missing', async () => {
            const next = jest.fn();
            await UserController.login(makeReq({}), makeRes(), next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        });

        it('should call next with 401 if user is not found', async () => {
            UserService.getOne.mockResolvedValue(null);
            const next = jest.fn();

            await UserController.login(makeReq({ walletAddress: 'GUNKNOWN' }), makeRes(), next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
        });

        it('should return 200 with user data when user exists', async () => {
            const user = { _id: 'u1', walletAddress: 'GABC123XYZ', name: 'TestCo' };
            UserService.getOne.mockResolvedValue(user);
            const res = makeRes();
            const next = jest.fn();

            await UserController.login(makeReq({ walletAddress: 'GABC123XYZ' }), res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, data: user })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });
});
