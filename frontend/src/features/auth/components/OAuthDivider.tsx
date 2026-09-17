/** Visual separator between email/password and OAuth sections. */
export function OAuthDivider() {
  return (
    <div className="relative my-2 flex items-center" role="separator" aria-label="or">
      <div className="flex-1 border-t border-border" />
      <span className="mx-3 text-xs text-muted-foreground">or</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}
