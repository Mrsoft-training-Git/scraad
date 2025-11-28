import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";

const CourseAllocation = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const allocations = [
    { id: 1, course: "Introduction to Programming", student: "John Doe", instructor: "Dr. Smith", status: "Active" },
    { id: 2, course: "Data Structures", student: "Jane Smith", instructor: "Prof. Johnson", status: "Active" },
    { id: 3, course: "Web Development", student: "Mike Brown", instructor: "Dr. Wilson", status: "Pending" },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-8 py-6">
          <div className="inline-block px-4 py-1 bg-primary text-primary-foreground rounded-lg text-sm font-semibold mb-2">
            Course Allocation
          </div>
          <p className="text-muted-foreground">Manage course assignments for students</p>
        </div>

        <div className="p-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Allocate Course</CardTitle>
              <CardDescription>Assign courses to students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">John Doe</SelectItem>
                      <SelectItem value="2">Jane Smith</SelectItem>
                      <SelectItem value="3">Mike Brown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Introduction to Programming</SelectItem>
                      <SelectItem value="2">Data Structures</SelectItem>
                      <SelectItem value="3">Web Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Instructor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Dr. Smith</SelectItem>
                      <SelectItem value="2">Prof. Johnson</SelectItem>
                      <SelectItem value="3">Dr. Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Allocate Course
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Allocations</CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search allocations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell className="font-medium">{allocation.course}</TableCell>
                      <TableCell>{allocation.student}</TableCell>
                      <TableCell>{allocation.instructor}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          allocation.status === "Active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {allocation.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-destructive">Remove</Button>
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

export default CourseAllocation;
