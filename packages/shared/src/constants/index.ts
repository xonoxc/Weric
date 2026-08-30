export const DB_URL_REGEX = /^postgres(ql)?:\/\/\S+$/i
export const HTTP_URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

export const DEFAULT_DATABASE_URL =
  "postgresql://weric:weric@localhost:5432/weric"

export const TEST_DATABASE_URL =
  "postgresql://weric:weric@localhost:5432/weric_test"
