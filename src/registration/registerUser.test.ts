import { registerUser } from "./registerUser";
import { RegistrationError } from "./errors";
import { userRepository } from "../users/userRepository";

const validInput = {
  email: "new.user@example.com",
  username: "new_user",
  password: "s3cret-pass",
};

beforeEach(() => {
  userRepository.reset();
});

describe("registerUser", () => {
  it("registers a user with valid data", () => {
    const user = registerUser(validInput);

    expect(user).toMatchObject({ email: "new.user@example.com" });
    expect(userRepository.findByEmail("new.user@example.com")).toBeDefined();
  });

  it("rejects an invalid email", () => {
    expect(() => registerUser({ ...validInput, email: "not-an-email" })).toThrow(
      "Please check the highlighted fields",
    );
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(() => registerUser({ ...validInput, password: "short" })).toThrow(
      "Please check the highlighted fields",
    );
  });

  it("rejects an email that is already registered", () => {
    expect(() => registerUser({ ...validInput, email: "John@Example.com" })).toThrow(
      "Email already registered",
    );
  });

  describe("username", () => {
    function captureError(username: string): RegistrationError {
      try {
        registerUser({ ...validInput, username });
      } catch (e) {
        if (e instanceof RegistrationError) return e;
        throw e;
      }
      throw new Error(`expected registerUser to throw for username "${username}"`);
    }

    it.each(["abc", "a".repeat(20), "User_42"])("accepts %p", (username) => {
      expect(registerUser({ ...validInput, username })).toMatchObject({ username });
    });

    it.each(["ab", "a".repeat(21)])("rejects %p by length", (username) => {
      const error = captureError(username);
      expect(error.message).toBe("Please check the highlighted fields");
      expect(error.fields.username).toContain("must be between 3 and 20 characters");
    });

    it.each(["new-user", "new user", "користувач", " new_user"])(
      "rejects %p with disallowed characters",
      (username) => {
        const error = captureError(username);
        expect(error.message).toBe("Please check the highlighted fields");
        expect(error.fields.username).toContain("may contain only Latin letters, digits and _");
      },
    );

    it("rejects a username that is already taken, ignoring case", () => {
      const error = captureError("john_doe");
      expect(error.code).toBe("USERNAME_TAKEN");
      expect(error.message).toBe("Username already taken");
    });
  });
});
