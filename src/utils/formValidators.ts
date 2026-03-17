import { z } from "zod";

export type ValidatorFn = (value: any) => string | true;

export const Validators = {
  /**
   * Checks if the field is present (not undefined, null, empty string, or empty array).
   *
   * @param msg Optional custom error message.
   * @returns ValidatorFn
   * @example
   * Validators.required()("something") // true
   * Validators.required()("") // "This field is required"
   * Validators.required("Name is required")(null) // "Name is required"
   */
  required: (msg = "This field is required"): ValidatorFn => {
    return (v) => {
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0))
        return msg;
      return true;
    };
  },

  /**
   * Validates a value against a regular expression.
   *
   * @param regex The RegExp to match against.
   * @param msg Optional error message.
   * @returns ValidatorFn
   * @example
   * Validators.pattern(/^[A-Z]+$/, "Only uppercase")("HELLO") // true
   * Validators.pattern(/^[A-Z]+$/, "Only uppercase")("Hello") // "Only uppercase"
   */
  pattern: (regex: RegExp, msg = "Invalid format"): ValidatorFn => {
    return (v) => !v || regex.test(v) || msg;
  },

  /**
   * Validates that a value is an email address.
   *
   * @param msg Optional error message.
   * @returns ValidatorFn
   * @example
   * Validators.email()("user@example.com") // true
   * Validators.email()("not-an-email") // "Invalid email address"
   */
  email: (msg = "Invalid email address"): ValidatorFn =>
    Validators.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, msg),

  /**
   * Validates that a value has at least a minimum number of characters.
   *
   * @param min The minimum length required.
   * @param msg Optional error message.
   * @returns ValidatorFn
   * @example
   * Validators.minLength(3)("ok") // "Minimum 3 characters"
   * Validators.minLength(3)("okay") // true
   */
  minLength: (min: number, msg?: string): ValidatorFn => {
    return (v) => !v || v.length >= min || msg || `Minimum ${min} characters`;
  },

  /**
   * Combines multiple validators. Returns the first error message, or true if valid.
   *
   * @param validators List of ValidatorFn functions.
   * @returns ValidatorFn
   * @example
   * Validators.combine(Validators.required(), Validators.email())("") // "This field is required"
   * Validators.combine(Validators.required(), Validators.email())("foo") // "Invalid email address"
   * Validators.combine(Validators.required(), Validators.email())("foo@bar.com") // true
   */
  combine: (...validators: ValidatorFn[]): ValidatorFn => {
    return (value) => {
      for (const validator of validators) {
        const result = validator(value);
        if (result !== true) return result;
      }
      return true;
    };
  },

  /**
   * Validates that a value is a valid date.
   * Date should not be in the future.
   *
   * @param msg Optional error message.
   * @returns ValidatorFn
   * @example
   * Validators.noFutureDate()("2025-01-01") // true
   * Validators.noFutureDate()("2025-01-02") // "Date must not be in the future"
   */
  noFutureDate: (msg = "Date must not be in the future"): ValidatorFn => {
    return (v) => {
      if (v && new Date(v) > new Date()) return msg;
      return true;
    };
  },

  /**
   * Integrates zod validation schemas.
   *
   * @param schema Zod schema instance
   * @returns ValidatorFn
   * @example
   * Validators.zod(z.string().min(2))("A") // "String must contain at least 2 character(s)"
   * Validators.zod(z.string().min(2))("AB") // true
   */
  zod: <T>(schema: z.ZodType<T>): ValidatorFn => {
    return (value) => {
      const result = schema.safeParse(value);
      return result.success || result.error.errors[0].message;
    };
  },
};
