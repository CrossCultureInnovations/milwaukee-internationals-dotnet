import { Container } from "./Container";

export function AppFooter() {
  return (
    <footer className="border-t border-border/70 bg-background/90">
      <Container className="py-4">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Milwaukee Internationals
        </p>
      </Container>
    </footer>
  );
}
