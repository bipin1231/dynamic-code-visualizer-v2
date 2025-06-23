"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Code,
  Play,
  Bug,
  Zap,
  Eye,
  Clock,
  BookOpen,
  CheckCircle,
  Monitor,
  Cpu,
  GitBranch,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [currentFeature, setCurrentFeature] = useState(0)

  const features = [
    {
      icon: <Code className="w-8 h-8" />,
      title: "Multi-Language Support",
      description:
        "Write and execute code in JavaScript, Python, C, C++, and Java with syntax highlighting and error detection.",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      icon: <Bug className="w-8 h-8" />,
      title: "Step-by-Step Debugging",
      description: "Debug your code line by line, set breakpoints, and watch variables change in real-time.",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Visual Execution Timeline",
      description: "See your code execution flow with an interactive timeline showing each step of the process.",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-time Code Analysis",
      description: "Get instant feedback on time complexity, algorithm analysis, and performance insights.",
      image: "/placeholder.svg?height=300&width=400",
    },
  ]

  const benefits = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Learn Programming Concepts",
      description: "Understand how algorithms work by visualizing each step of execution.",
    },
    {
      icon: <Monitor className="w-6 h-6" />,
      title: "Debug More Effectively",
      description: "Find and fix bugs faster with our interactive debugging tools.",
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: "Analyze Performance",
      description: "Get insights into time and space complexity of your algorithms.",
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: "Understand Control Flow",
      description: "See how loops, conditions, and function calls execute in real-time.",
    },
  ]

  const sampleCodes = [
    "Fibonacci Sequence",
    "Bubble Sort Algorithm",
    "Binary Search",
    "Factorial Calculation",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [features.length])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            {/* Logo and Title */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Code className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Dynamic Code Visualizer
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Visualize, debug, and understand your code execution step by step. Perfect for learning algorithms and
                debugging complex logic.
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/editor">
                <Button size="lg" className="text-lg px-8 py-6 group">
                  <ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                  To the Code Editor
                </Button>
              </Link>
              <Badge variant="secondary" className="text-sm px-4 py-2">
                No installation required • Works in your browser
              </Badge>
            </div>

            {/* Hero Image */}
            {/* <div className="mt-16 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
              <img
                src="/placeholder.svg?height=600&width=1000"
                alt="Code Visualizer Interface"
                className="mx-auto rounded-lg shadow-2xl border"
              />
            </div> */}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to visualize, understand, and debug your code effectively.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-300 ${
                    index === currentFeature ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
                  }`}
                  onClick={() => setCurrentFeature(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          index === currentFeature ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="relative">
              <img
                src={features[currentFeature].image || "/placeholder.svg"}
                alt={features[currentFeature].title}
                className="rounded-lg shadow-xl border w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps and start visualizing your code immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Code className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">1. Write Your Code</h3>
              <p className="text-muted-foreground">
                Use our Monaco editor to write code in JavaScript, Python, C, C++, or Java. Choose from sample
                algorithms or write your own.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">2. Run or Debug</h3>
              <p className="text-muted-foreground">
                Execute your code normally or enter debug mode to step through execution. Set breakpoints and control
                the flow.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">3. Visualize & Learn</h3>
              <p className="text-muted-foreground">
                Watch the execution timeline, see variable changes, and understand how your algorithm works step by
                step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Dynamic Code Visualizer?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Perfect for students, educators, and developers who want to understand code execution better.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Algorithms Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pre-loaded Sample Algorithms</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start learning immediately with our collection of classic algorithms and data structures.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleCodes.map((algorithm, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium">{algorithm}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/editor">
              <Button variant="outline" size="lg" className="group">
                <ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                Try All Samples
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Visualize Your Code?</h2>
          <p className="text-xl text-muted-foreground">
            Start debugging and understanding your algorithms like never before. No installation required - everything
            runs in your browser.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/editor">
              <Button size="lg" className="text-lg px-8 py-6 group">
                <ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                Launch Code Editor
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Get started in under 30 seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Code className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Dynamic Code Visualizer</span>
            </div>
            <p className="text-muted-foreground text-center">
              Built with Next.js, Monaco Editor, and modern web technologies.
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .bg-grid-pattern {
          background-image: radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  )
}
