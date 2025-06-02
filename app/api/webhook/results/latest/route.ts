import { NextResponse } from "next/server"

// In a real implementation, you'd store results in a database
// For demo purposes, we'll use a simple in-memory store
let latestResults: any[] = []

export async function GET() {
  try {
    // Return and clear the latest results
    const results = [...latestResults]
    latestResults = [] // Clear after returning

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error fetching latest results:", error)
    return NextResponse.json({ error: "Failed to fetch latest results" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Add to latest results
    latestResults.push({
      id: Date.now().toString(),
      book_title: body.book_title,
      timestamp: new Date().toISOString(),
      data: body,
    })

    return NextResponse.json({ status: "success" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to store result" }, { status: 500 })
  }
}
