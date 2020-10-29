// const ms = require('humanize-ms');
import urlutil from 'url';
import { checkBucketName } from './utils/checkBucketName';
import { setRegion } from './utils/setRegion';

function setEndpoint(endpoint, secure) {
  let url = urlutil.parse(endpoint);

  if (!url.protocol) {
    url = urlutil.parse(`http${secure ? 's' : ''}://${endpoint}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Endpoint protocol must be http or https.');
  }

  return url;
}

export default function initOptions(options) {
  if (!options || !options.accessKeyId || !options.accessKeySecret) {
    throw new Error('require accessKeyId, accessKeySecret');
  }
  if (options.bucket) {
    checkBucketName(options.bucket);
  }
  const opts = {
    region: 'oss-cn-hangzhou',
    internal: false,
    secure: false,
    timeout: 60000,
    bucket: null,
    endpoint: null,
    cname: false,
    isRequestPay: false,
    sldEnable: false,
    headerEncoding: 'utf-8',
    refreshSTSToken: null,
    ...options,
  };

  opts.accessKeyId = opts.accessKeyId.trim();
  opts.accessKeySecret = opts.accessKeySecret.trim();

  // if (opts.timeout) {
  //   opts.timeout = ms(opts.timeout);
  // }

  if (opts.endpoint) {
    opts.endpoint = setEndpoint(opts.endpoint, opts.secure);
  } else if (opts.region) {
    opts.endpoint = setRegion(opts.region, opts.internal, opts.secure);
  } else {
    throw new Error('require options.endpoint or options.region');
  }

  opts.inited = true;
  return opts;
}
