import { Connection } from "mongoose";

declare global {
    var mongoose: {

        conn: Connection | null,
        promise: Promise<Connection> | null;
    }
};
declare module "*.png" {
    const value: any;
    export default value;
  }

export {};