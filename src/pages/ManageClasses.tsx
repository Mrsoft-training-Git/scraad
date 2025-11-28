import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Users, Plus } from "lucide-react";

const ManageClasses = () => {
  const classes = [
    { id: 1, course: "Introduction to Programming", date: "2024-01-15", time: "10:00 AM", instructor: "Dr. Smith", students: 45, room: "Room 101" },
    { id: 2, course: "Data Structures", date: "2024-01-16", time: "2:00 PM", instructor: "Prof. Johnson", students: 38, room: "Room 205" },
    { id: 3, course: "Web Development", date: "2024-01-17", time: "9:00 AM", instructor: "Dr. Wilson", students: 52, room: "Lab 3" },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-8 py-6">
          <div className="inline-block px-4 py-1 bg-primary text-primary-foreground rounded-lg text-sm font-semibold mb-2">
            Manage Classes
          </div>
          <p className="text-muted-foreground">Schedule and manage class sessions</p>
        </div>

        <div className="p-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule New Class</CardTitle>
              <CardDescription>Create a new class session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Input placeholder="Select or enter course" />
                </div>
                <div className="space-y-2">
                  <Label>Instructor</Label>
                  <Input placeholder="Assign instructor" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" />
                </div>
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Input placeholder="Room or location" />
                </div>
                <div className="space-y-2">
                  <Label>Max Students</Label>
                  <Input type="number" placeholder="50" />
                </div>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Class
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled Classes</CardTitle>
              <CardDescription>View and manage upcoming classes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">{classItem.course}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {classItem.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {classItem.time}
                        </div>
                      </TableCell>
                      <TableCell>{classItem.instructor}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {classItem.students}
                        </div>
                      </TableCell>
                      <TableCell>{classItem.room}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-destructive">Cancel</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ManageClasses;
