export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-3 text-center text-xs opacity-75">
        <p>&copy; {new Date().getFullYear()} Open Distance and e-Learning Centre, University of Port Harcourt. All rights reserved.</p>
      </div>
    </footer>
  );
};