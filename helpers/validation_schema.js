const Joi = require("joi");

const authSchema = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .lowercase()
    .required(),
  password: Joi.string().min(2).required(),
});

module.exports = {
  authSchema,
};
