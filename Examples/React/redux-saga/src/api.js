export function fetchUserInfoAPI() {
  return new Promise((resolve) => {
    const mockData = {
      id: '123',
      name: '小明',
      age: 18
    };

    resolve(mockData)
  });
}
