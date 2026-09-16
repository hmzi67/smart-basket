import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;
if (!MONGODB_URI) {
    throw new Error("Missing MongoDB connection string. Set MONGODB_URI in .env.local.")
}
type MongooseCache = {
    conn: mongoose.Connection | null,
    promise: Promise<mongoose.Connection> | null
}

const cache: MongooseCache = global.mongoose || { conn: null, promise: null }
if (!global.mongoose) {
    global.mongoose = cache
}

// mongoose readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
const CONNECTED = 1
const CONNECTING = 2

const connectDb = async () => {
    // Only reuse a handle that is actually live.
    //
    // The cache used to be returned unconditionally. When the socket dropped
    // (Atlas idle timeout, laptop sleep, a network blip) the dead handle was
    // still handed out, so every query sat in mongoose's buffer and failed with
    // "Operation `users.findOne()` buffering timed out after 10000ms" - which
    // showed up as intermittent 500s on pages that had worked a minute earlier.
    if (cache.conn?.readyState === CONNECTED) {
        return cache.conn
    }

    // A handle that is mid-connect still has a promise in flight worth awaiting;
    // anything else is dead and must be redialled.
    if (cache.conn && cache.conn.readyState !== CONNECTING) {
        cache.conn = null
        cache.promise = null
    }

    if (!cache.promise) {
        cache.promise = mongoose
            .connect(MONGODB_URI, {
                // fail fast instead of buffering for the default 30s
                serverSelectionTimeoutMS: 10000,
            })
            .then((m) => m.connection)
    }

    try {
        const conn = await cache.promise
        cache.conn = conn
        return conn
    } catch (error) {
        // let the next call redial rather than latching the failure
        cache.promise = null
        cache.conn = null
        console.error("MongoDB connection error:", error)
        throw error
    }
}
export default connectDb;
