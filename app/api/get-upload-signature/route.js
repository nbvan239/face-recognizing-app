import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  const { bucketName, prefix } = await request.json();

  const accessKey = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;
  const secretKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;

  try {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 12);

    const policyDocument = {
      expiration: expirationDate.toISOString(),
      conditions: [
        { bucket: bucketName },
        { acl: 'public-read' },
        { success_action_status: '201' },
        ['starts-with', '$Content-Type', 'image/'],
        ['starts-with', '$Filename', ''],
        ['starts-with', '$name', ''],
        ['starts-with', '$key', prefix],
        ['content-length-range', 0, 10485760],
        ['starts-with', '$chunk', ''],
        ['starts-with', '$chunks', ''],
      ],
    };

    const policyBase64 = Buffer.from(JSON.stringify(policyDocument)).toString('base64');

    const signature = crypto
      .createHmac('sha1', secretKey)
      .update(policyBase64)
      .digest('base64');

    const response = {
      AWSAccessKeyID: accessKey,
      PolicyDocument: policyBase64,
      PolicyDocumentSignature: signature,
    };

    return NextResponse.json({ status: 'ok', data: response });
  } catch (error) {
    console.error('Error generating upload signature:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
