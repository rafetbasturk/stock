import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardCard({
  title,
  value,
}: {
  title: string
  value: string | number
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
