import { Response } from "express";

export async function doHealthCheck(res: Response) {

    return res.status(200).send("HEALTHY");
}