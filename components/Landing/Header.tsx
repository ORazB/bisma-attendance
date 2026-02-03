"use client";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { AttendanceRequest } from "@/app/generated/prisma";

import { SignedIn, UserButton } from '@clerk/nextjs';

export default function Header({userAttendanceRequests}: {userAttendanceRequests: AttendanceRequest[]}) {

  async function handleApprove(requestId: number) {
    await fetch(`/api/attendance-request/${requestId}/approve`, {
      method: "POST",
    });
  }

  async function handleReject(requestId: number) {
    await fetch(`/api/attendance-request/${requestId}/reject`, {
      method: "POST",
    });
  }
  
  return (
    <header className="flex mx-auto max-w-7xl justify-between items-center p-5 border-b">
    <div className=""></div>
    <div className="flex items-center gap-8">
      <Popover>
        <PopoverTrigger>
          <i className="fas fa-envelope text-2xl cursor-pointer text-primary"></i>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          {userAttendanceRequests.length > 0 ? (
            <div className="space-y-3">
              {userAttendanceRequests.map((request, index) => (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <div
                      className="border-l-4 border-primary pl-4 py-2 hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-calendar-day text-primary"></i>
                        <span className="font-semibold text-sm">
                          {new Date(request.requestedDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <i className={`fas ${request.status === 'PENDING' ? 'fa-clock' : 'fa-times-circle'} text-primary text-xs`}></i>
                        <span className="text-xs capitalize font-medium">
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="w-64">
                    <DialogTitle>Attendance Request</DialogTitle>
                    <div className="space-y-2">

                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-calendar-day text-primary"></i>
                        <span className="font-semibold text-sm">
                          {new Date(request.requestedDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-clipboard text-primary"></i>
                        <span className="font-semibold text-sm">
                          {request.requestedEventType}
                        </span>
                      </div>

                      {request.reason && (
                        <div className="flex items-start gap-2 mt-2">
                          <i className="fas fa-comment-dots text-primary text-xs mt-0.5"></i>
                          <p className="text-xs text-muted-foreground italic">
                            {request.reason}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 mt-2">
                        <Button onClick={() => handleApprove(request.id)} size="sm" className="bg-primary hover:bg-primary/90">Approve</Button>
                        <Button onClick={() => handleReject(request.id)} variant="outline" size="sm">Reject</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-inbox text-primary text-4xl mb-3 opacity-50"></i>
              <p className="text-sm text-muted-foreground">No attendance requests</p>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <SignedIn>
        <div className="scale-150">
          <UserButton />
        </div>
      </SignedIn>
    </div>
  </header>
  )
}