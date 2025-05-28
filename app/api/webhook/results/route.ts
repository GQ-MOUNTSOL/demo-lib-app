import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("Received result from Make.com:", body)

    // Validate the incoming data
    if (!body || !body.book_title) {
      return NextResponse.json({ error: "Invalid payload - missing book_title" }, { status: 400 })
    }

    // Here you could:
    // 1. Store in a database
    // 2. Send to connected clients via WebSocket
    // 3. Cache the result for the frontend to fetch

    // For now, we'll just acknowledge receipt
    return NextResponse.json({
      status: "success",
      message: "Result received successfully",
      book_title: body.book_title,
      received_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Webhook endpoint is active",
    endpoint: "/api/webhook/results",
    method: "POST",
  })
}
