// /pages/api/save-image-data.js

import clientPromise from "@/lib/mongo";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db("vtvLive");
    const { imageId, key } = await request.json();

    const post = await db.collection("imageEntry").insertOne({
      imageId,
      key,
    });

    return NextResponse.json({ status: "ok", data: post });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { status: "error", message: e.message },
      { status: 500 }
    );
  }
}
