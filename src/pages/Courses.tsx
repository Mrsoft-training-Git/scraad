import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Filter } from "lucide-react";
import { useState } from "react";

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const allCourses = [
    {
      title: "E-Business Model",
      price: "₦40,000",
      students: 1,
      category: "Business",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    },
    {
      title: "National Sustainable and Entrepreneurship Program (NSEP)",
      price: "₦40,000",
      students: 2,
      category: "Business",
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
    },
    {
      title: "Resource Acquisition",
      price: "₦35,000",
      students: 0,
      category: "Business",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    },
    {
      title: "Human Resource and Management",
      price: "₦40,300",
      students: 13,
      category: "Business",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    },
    {
      title: "Digital Marketing Fundamentals",
      price: "₦38,000",
      students: 25,
      category: "Marketing",
      image: "https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=800&q=80",
    },
    {
      title: "Financial Management for Startups",
      price: "₦42,000",
      students: 18,
      category: "Finance",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    },
    {
      title: "Project Management Professional",
      price: "₦45,000",
      students: 30,
      category: "Management",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    },
    {
      title: "Data Analytics and Visualization",
      price: "₦50,000",
      students: 22,
      category: "Technology",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    },
  ];

  const categories = ["All", "Business", "Marketing", "Finance", "Management", "Technology"];

  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header Section */}
      <section className="relative bg-hero-gradient text-white py-16 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-heading font-bold text-4xl lg:text-5xl">
              Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">Courses</span>
            </h1>
            <p className="text-lg text-white/90">
              Discover a wide range of professional courses designed to advance your career
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-base bg-white/95 backdrop-blur-sm border-white/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          {/* Categories Filter */}
          <div className="mb-8 flex flex-wrap gap-3 items-center justify-center">
            <Filter className="w-5 h-5 text-muted-foreground" />
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Course Count */}
          <div className="mb-6 text-center">
            <p className="text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filteredCourses.length}</span> courses
            </p>
          </div>

          {/* Courses Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredCourses.map((course, index) => (
              <Card key={index} className="group overflow-hidden border-border/50 bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col">
                <div className="aspect-video overflow-hidden relative">
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary z-10">
                    {course.category}
                  </div>
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                      {course.category}
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-4 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between mb-5 mt-auto">
                    <span className="text-2xl font-bold text-primary">{course.price}</span>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {course.students}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/20 font-semibold">
                    Enroll Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No courses found. Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Courses;
