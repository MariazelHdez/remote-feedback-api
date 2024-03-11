"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doHealthCheck = void 0;
async function doHealthCheck(res) {
    return res.status(200).send("HEALTHY");
}
exports.doHealthCheck = doHealthCheck;
