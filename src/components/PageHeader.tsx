interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export const PageHeader = ({ title, description, action }: Props) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pl-12 lg:pl-0">
    <div>
      <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
    {action}
  </div>
);
