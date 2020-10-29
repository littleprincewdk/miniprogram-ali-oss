interface Config {
  exclude?: string[];
}

type FormatObjKeyType = 'firstUpperCase' | 'firstLowerCase';

function handelFormat(key: string, type: FormatObjKeyType, options?: Config) {
  if (options && options.exclude?.includes(key)) return key;
  if (type === 'firstUpperCase') {
    key = key.replace(/^./, (_: string) => _.toUpperCase());
  } else if (type === 'firstLowerCase') {
    key = key.replace(/^./, (_: string) => _.toLowerCase());
  }
  return key;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function formatObjKey(obj: any, type: FormatObjKeyType, options?: Config): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  let o: any;
  if (Array.isArray(obj)) {
    o = [];
    for (let i = 0; i < obj.length; i += 1) {
      o.push(formatObjKey(obj[i], type, options));
    }
  } else {
    o = {};
    Object.keys(obj).forEach((key) => {
      o[handelFormat(key, type, options)] = formatObjKey(obj[key], type, options);
    });
  }
  return o;
}
