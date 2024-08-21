export function joinPaths(...paths: string[]): string {
    return paths.map((path, index) => {
      if (index === 0) {
        return path.trim().replace(/\/+$/, '');
      } else {
        return path.trim().replace(/(^\/+|\/+$)/g, '');
      }
    }).filter(x => x.length).join('/');
  }