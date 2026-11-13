import { prisma } from "../lib/db/prisma";
import { hashPassword } from "../lib/auth/argon";
import { Role } from "@prisma/client";
import { logAuditInTx } from "../lib/audit/audit-logger";

interface BootstrapArgs {
  name: string;
  email: string;
  password?: string;
  identifier?: string;
}

function parseCliArgs(): BootstrapArgs {
  const args = process.argv.slice(2);
  const result: Partial<BootstrapArgs> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--name" && i + 1 < args.length) {
      result.name = args[++i];
    } else if (arg === "--email" && i + 1 < args.length) {
      result.email = args[++i];
    } else if (arg === "--password" && i + 1 < args.length) {
      result.password = args[++i];
    } else if (arg === "--identifier" && i + 1 < args.length) {
      result.identifier = args[++i];
    }
  }

  // Fallback to environment variables if not passed via CLI flags
  return {
    name: result.name || process.env["BOOTSTRAP_ADMIN_NAME"] || "",
    email: result.email || process.env["BOOTSTRAP_ADMIN_EMAIL"] || "",
    password: result.password || process.env["BOOTSTRAP_ADMIN_PASSWORD"],
    identifier: result.identifier || process.env["BOOTSTRAP_ADMIN_IDENTIFIER"],
  };
}

export function validatePasswordStrength(password: string): { isValid: boolean; reason?: string } {
  if (password.length < 10) {
    return { isValid: false, reason: "Password must be at least 10 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, reason: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, reason: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, reason: "Password must contain at least one digit" };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { isValid: false, reason: "Password must contain at least one special character" };
  }
  return { isValid: true };
}

export async function bootstrapFirstAdmin(args: BootstrapArgs): Promise<void> {
  const { name, email, password, identifier } = args;

  if (!name || !email || !password) {
    console.error("Error: Missing required parameters.");
    console.error("Usage: pnpm bootstrap:admin --name <name> --email <email> --password <password> [--identifier <identifier>]");
    console.error("Or define BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD in environment.");
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error("Error: Invalid email format supplied.");
    process.exit(1);
  }

  // Validate password strength
  const strength = validatePasswordStrength(password);
  if (!strength.isValid) {
    console.error(`Error: Password strength check failed: ${strength.reason}`);
    process.exit(1);
  }

  // 1. Refusal check: Ensure NO admin exists in the database
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
    select: { id: true, identifier: true, email: true },
  });

  if (existingAdmin) {
    console.error("REFUSED: An institutional administrator already exists in this database.");
    console.error("The bootstrap command is strictly reserved for initial system initialization.");
    process.exit(1);
  }

  const adminIdentifier = identifier || email;

  // 2. Hash password with Argon2id
  const passwordHash = await hashPassword(password);

  // 3. Create Admin in transaction with audit log
  const adminUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        identifier: adminIdentifier,
        email,
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
      },
    });

    await logAuditInTx(tx, {
      userId: user.id,
      action: "BOOTSTRAP_FIRST_ADMIN",
      entityType: "User",
      entityId: user.id,
      newValues: {
        identifier: adminIdentifier,
        email,
        role: Role.ADMIN,
        name,
      },
    });

    return user;
  });

  console.log("==================================================================");
  console.log("SRGC Result Management System — Initial Administrator Bootstrapped");
  console.log("==================================================================");
  console.log(`Administrator ID    : ${adminUser.id}`);
  console.log(`Login Identifier    : ${adminUser.identifier}`);
  console.log(`Registered Email    : ${adminUser.email}`);
  console.log(`Role                : ${adminUser.role}`);
  console.log("Status              : ACTIVE (Password safely hashed and committed)");
  console.log("==================================================================");
}

// Run CLI directly when executed
if (require.main === module) {
  const cliArgs = parseCliArgs();
  bootstrapFirstAdmin(cliArgs)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Bootstrap execution failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    });
}

