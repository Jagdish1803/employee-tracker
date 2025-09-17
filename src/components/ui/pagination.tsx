import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function Pagination({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <nav role="navigation" aria-label="pagination" className={cn("flex w-full justify-center", className)} {...props} />
}

export function PaginationContent({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <ul className={cn("flex items-center gap-1", className)} {...props} />
}

export function PaginationItem({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li className={cn("", className)} {...props} />
}

export function PaginationLink({ className, isActive, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { isActive?: boolean }) {
  return (
    <a
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export function PaginationPrevious({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <PaginationLink aria-label="Go to previous page" {...props} className={cn("", className)}>
      <ChevronLeft className="h-4 w-4 mr-1" />
      <span className="sr-only">Previous</span>
    </PaginationLink>
  )
}

export function PaginationNext({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <PaginationLink aria-label="Go to next page" {...props} className={cn("", className)}>
      <ChevronRight className="h-4 w-4 ml-1" />
      <span className="sr-only">Next</span>
    </PaginationLink>
  )
}

export function PaginationEllipsis({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("inline-flex h-9 w-9 items-center justify-center", className)} {...props}>
      ...
    </span>
  )
}
