export const PASSWORD_POLICY_HINT =
  "La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y símbolo.";

export const WEAK_PASSWORD_SIGNIN_HINT =
  "Tu contraseña no cumple la política de seguridad actual (mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo). Usa «¿Olvidaste tu contraseña?» para restablecerla y poder ingresar.";

/** Misma regla que pide el mensaje: 8+ caracteres con mayúscula, minúscula, número y símbolo. */
export function meetsPasswordPolicy(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-ZÁÉÍÓÚÑ]/.test(password) &&
    /[a-záéíóúñ]/.test(password) &&
    /d/.test(password) &&
    /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/.test(password)
  );
}

type AuthErrorLike = { message?: string; code?: string } | string | null | undefined;

function getMessage(error: AuthErrorLike): string {
  if (!error) return "";
  return typeof error === "string" ? error : error.message ?? "";
}

function getCode(error: AuthErrorLike): string {
  if (!error || typeof error === "string") return "";
  return error.code ?? "";
}

export function isWeakPasswordError(error: AuthErrorLike): boolean {
  const message = getMessage(error);
  const code = getCode(error);
  return (
    code === "weak_password" ||
    message.includes("Password should be at least") ||
    message.includes("Password should contain")
  );
}

export function translateAuthError(error: AuthErrorLike): string {
  const message = getMessage(error);
  const lower = message.toLowerCase();

  if (message.includes("Invalid login credentials"))
    return "Correo o contraseña incorrectos. Si no recuerdas tu contraseña, usa «¿Olvidaste tu contraseña?».";
  if (message.includes("Email not confirmed"))
    return "Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada y la carpeta de spam.";
  if (message.includes("already registered"))
    return "No pudimos completar el registro. Revisa tu correo o intenta iniciar sesión.";
  if (isWeakPasswordError(error)) return PASSWORD_POLICY_HINT;
  if (lower.includes("rate limit") || lower.includes("too many requests"))
    return "Hiciste demasiados intentos seguidos. Espera unos minutos e intenta de nuevo.";
  if (message.includes("For security purposes"))
    return "Por seguridad, espera unos segundos antes de volver a intentar.";
  if (message.includes("different from the old password"))
    return "La nueva contraseña debe ser diferente a la actual.";
  if (message.includes("Auth session missing"))
    return "Tu sesión expiró. Abre de nuevo el enlace del correo o vuelve a iniciar sesión.";
  if (lower.includes("invalid email") || lower.includes("unable to validate email"))
    return "El correo electrónico no es válido. Revísalo e intenta de nuevo.";
  return message;
}
