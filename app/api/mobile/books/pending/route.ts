import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for demo - replace with your database
const pendingBooks: Array<{
  id: string
  title: string
  author?: string
  requestedBy: string
  timestamp: string
  status: "pending" | "approved" | "rejected"
  deviceInfo?: any
}> = []

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      books: pendingBooks.filter((book) => book.status === "pending"),
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch pending books" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, author, requestedBy, deviceInfo } = body

    if (!title || !requestedBy) {
      return NextResponse.json({ success: false, error: "Title and requestedBy are required" }, { status: 400 })
    }

    const newBook = {
      id: Date.now().toString(),
      title,
      author: author || "Unknown",
      requestedBy,
      timestamp: new Date().toISOString(),
      status: "pending" as const,
      deviceInfo,
    }

    pendingBooks.push(newBook)

    return NextResponse.json({
      success: true,
      message: "Book request submitted for approval",
      bookId: newBook.id,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to submit book request" }, { status: 500 })
  }
}
