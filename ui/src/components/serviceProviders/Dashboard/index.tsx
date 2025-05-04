import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router";
// import NavBar from "../navBar";
import { useQuery, gql } from "@apollo/client";
import SearchDataDasBoard from "./searchDasBoard";
import MainNaveBar from "../menuBar";

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    getDashboardData {
      totalUsers
      totalBookingsIds
      recentActivityIds
      categoriesServiceTypes
    }
  }
`;
export default function Dashboard() {
  const { loading, error, data } = useQuery(GET_DASHBOARD_DATA);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  const {
    totalUsers,
    totalBookingsIds,
    recentActivityIds,
    categoriesServiceTypes,
  } = data.getDashboardData;

  return (
    <div className="flex min-h-screen  items-center w-full flex-col">
      <div className="pb-11">
        <MainNaveBar />
      </div>
      <main className="flex-1">
        <div className="container py-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>
                  Overview of your contact management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                    <span className="text-3xl font-bold">
                      {totalUsers.length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Total User
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                    <span className="text-3xl font-bold">
                      {totalBookingsIds.length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Favorites
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                    <span className="text-3xl font-bold">
                      {recentActivityIds.length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Recent Activity
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                    <span className="text-3xl font-bold">
                      {categoriesServiceTypes.length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Categories
                    </span>
                  </div>
                  <Button className="justify-start" variant="outline" asChild>
                    <Link to="/contacts">All Contacts</Link>
                  </Button>
                  <Button className="justify-start" variant="outline" asChild>
                    <Link to="/favorites">View Favorites</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <SearchDataDasBoard />
        </div>
      </main>
    </div>
  );
}
