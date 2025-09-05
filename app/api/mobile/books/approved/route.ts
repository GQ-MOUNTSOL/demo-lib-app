import { type NextRequest, NextResponse } from "next/server"

// Import approved books from the approve route
import { approvedBooks } from "../approve/route"

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      books: approvedBooks,
      count: approvedBooks.length,
    })
  } catch (error) {
    console.error("Error fetching approved books:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch approved books" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { book } = body

    if (!book) {
      return NextResponse.json({ success: false, error: "Book data is required" }, { status: 400 })
    }

    const approvedBook = {
      ...book,
      approvedAt: new Date().toISOString(),
    }

    approvedBooks.push(approvedBook)

    return NextResponse.json({
      success: true,
      book: approvedBook,
      message: "Book added to approved list",
    })
  } catch (error) {
    console.error("Error adding approved book:", error)
    return NextResponse.json({ success: false, error: "Failed to add approved book" }, { status: 500 })
  }
}
