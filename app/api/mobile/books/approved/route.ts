import { NextResponse } from "next/server"

// This would connect to your actual database
const pendingBooks: Array<{
  id: string
  title: string
  author?: string
  requestedBy: string
  timestamp: string
  status: "pending" | "approved" | "rejected"
  deviceInfo?: any
  approvedBy?: string
  approvedAt?: string
}> = []

export async function GET() {
  try {
    const approvedBooks = pendingBooks.filter((book) => book.status === "approved")

    return NextResponse.json({
      success: true,
      books: approvedBooks,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch approved books" }, { status: 500 })
  }
}
