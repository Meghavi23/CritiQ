/**
 * Validation middleware factory.
 * @param {import('joi').Schema} schema  - Joi schema to validate against
 * @param {'body'|'query'|'params'} source - Request property to validate (default: 'body')
 */
const validate = (schema, source = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const err = new Error(error.details.map((d) => d.message).join('; '));
        err.statusCode = 400;
        return next(err);
    }

    req[source] = value; // replace with sanitised/coerced value
    next();
};

module.exports = validate;
