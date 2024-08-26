type Operation<T> = () => Promise<T>;
type IsSuccessful<T> = (result: T) => boolean;

export function retry<T>(
  operation: Operation<T>,
  isSuccessful: IsSuccessful<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  const executeOperation = async (attempt: number): Promise<T> => {
    return operation()
      .then((result) => {
        if (isSuccessful(result)) {
          return result;
        } else if (attempt < maxRetries) {
          return new Promise((res) => setTimeout(res, delay)).then(() =>
            executeOperation(attempt + 1),
          );
        } else {
          return Promise.reject(
            new Error("Not successful in give number of retries"),
          );
        }
      })
      .catch(async (error) => {
        if (attempt < maxRetries) {
          console.log(`Retry count - ${attempt}`);
          return new Promise((res) => setTimeout(res, delay)).then(() =>
            executeOperation(attempt + 1),
          );
        } else {
          return Promise.reject(error);
        }
      });
  };

  return executeOperation(0);
}
