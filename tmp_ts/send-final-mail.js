"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mail_1 = require("./mail");
const metrices_1 = require("./metrices");
async function main() {
    const data = (0, metrices_1.getData)();
    const result = await (0, metrices_1.calculate)(data);
    await (0, mail_1.sendMail)(result);
}
main();
