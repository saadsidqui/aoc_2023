import crypto from "node:crypto";

let _uid = 0;

export const unique_id = () => {
	return _uid++;
};

export const sha1 = (payload) => crypto.createHash('sha1').update(payload).digest('hex');
export const sha256 = (payload) => crypto.createHash('sha256').update(payload).digest('hex');

export const wait = (ms) => {
	return new Promise(resolve => setTimeout(resolve, ms));
};
