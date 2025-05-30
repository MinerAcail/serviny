// RouteDebugger.tsx - Add this component to debug route data
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  Route, 
  Database, 
  Globe, 
  Eye, 
  EyeOff,
  Bug,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface RouteDebuggerProps {
  orders: any[];
  riders: any[];
  riderRoutes: Map<string, any>;
  databaseRoutes: Map<string, any>;
}

export function RouteDebugger({ orders, riders, riderRoutes, databaseRoutes }: RouteDebuggerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  // Analyze route data
  const routeAnalysis = {
    totalOrders: orders.length,
    ordersWithRoutes: orders.filter(order => order.order.routeData?.geojson).length,
    validRoutes: 0,
    invalidRoutes: 0,
    googleRoutes: riderRoutes.size,
    databaseRoutes: databaseRoutes.size,
    riders: riders.length,
    ridersWithRoutes: riders.filter(rider => 
      riderRoutes.has(rider.id) || 
      orders.some(order => order.rider?.id === rider.id && order.order.routeData?.geojson)
    ).length
  };

  // Validate route data
  const validateRouteData = (geojsonString: string) => {
    try {
      const geoJSON = JSON.parse(geojsonString);
      
      if (geoJSON.type !== "Feature" || geoJSON.geometry?.type !== "LineString") {
        return { isValid: false, error: "Invalid GeoJSON structure" };
      }
      
      const coordinates = geoJSON.geometry.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length === 0) {
        return { isValid: false, error: "No coordinates found" };
      }
      
      const validCoords = coordinates.filter((coord: any) => 
        Array.isArray(coord) && 
        coord.length >= 2 && 
        typeof coord[0] === 'number' && 
        typeof coord[1] === 'number' &&
        !isNaN(coord[0]) && 
        !isNaN(coord[1])
      );
      
      if (validCoords.length === 0) {
        return { isValid: false, error: "No valid coordinates" };
      }
      
      // Check coordinate bounds (rough check for Ghana)
      const [lng, lat] = validCoords[0];
      if (lng < -3 || lng > 2 || lat < 4 || lat > 12) {
        return { 
          isValid: false, 
          error: `Coordinates outside Ghana bounds: [${lng}, ${lat}]`,
          coordinates: validCoords
        };
      }
      
      routeAnalysis.validRoutes++;
      return { 
        isValid: true, 
        coordinates: validCoords,
        bounds: {
          start: validCoords[0],
          end: validCoords[validCoords.length - 1]
        },
        metadata: geoJSON.metadata
      };
    } catch (error) {
      routeAnalysis.invalidRoutes++;
      return { isValid: false, error: `Parse error: ${error.message}` };
    }
  };

  const ordersWithRouteData = orders.filter(order => order.order.routeData?.geojson);

  if (!isExpanded) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white rounded-full h-12 w-12 shadow-lg"
        >
          <Bug className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-white rounded-xl shadow-2xl border border-gray-200">
      <Card className="h-full">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-purple-500" />
              Route Data Debugger
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="rounded-lg"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{routeAnalysis.totalOrders}</div>
              <div className="text-sm text-blue-600">Total Orders</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{routeAnalysis.ordersWithRoutes}</div>
              <div className="text-sm text-green-600">With Route Data</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{routeAnalysis.googleRoutes}</div>
              <div className="text-sm text-purple-600">Google Routes</div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">{routeAnalysis.databaseRoutes}</div>
              <div className="text-sm text-orange-600">DB Routes</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Route Data Analysis */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                Database Routes
              </h3>
              
              <ScrollArea className="h-96 border rounded-lg">
                <div className="p-4 space-y-3">
                  {ordersWithRouteData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No route data found
                    </div>
                  ) : (
                    ordersWithRouteData.map((order) => {
                      const validation = validateRouteData(order.order.routeData.geojson);
                      
                      return (
                        <div 
                          key={order.orderId}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedOrder === order.orderId 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedOrder(
                            selectedOrder === order.orderId ? null : order.orderId
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                #{order.orderId.slice(-6)}
                              </span>
                              {validation.isValid ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {order.rider?.name || 'No Rider'}
                            </Badge>
                          </div>
                          
                          {validation.isValid ? (
                            <div className="text-xs text-green-600">
                              ✓ {validation.coordinates?.length} coordinates
                              {validation.metadata && (
                                <>
                                  <br />📏 {validation.metadata.distance}
                                  <br />⏱️ {validation.metadata.duration}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-red-600">
                              ❌ {validation.error}
                            </div>
                          )}
                          
                          {selectedOrder === order.orderId && validation.isValid && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-xs">
                              <div className="space-y-1">
                                <div><strong>Start:</strong> [{validation.bounds?.start[0].toFixed(5)}, {validation.bounds?.start[1].toFixed(5)}]</div>
                                <div><strong>End:</strong> [{validation.bounds?.end[0].toFixed(5)}, {validation.bounds?.end[1].toFixed(5)}]</div>
                                <div><strong>Vendor:</strong> {order.vendor.name}</div>
                                <div><strong>Customer:</strong> {order.customer.name}</div>
                                {validation.metadata?.summary && (
                                  <div><strong>Summary:</strong> {validation.metadata.summary}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Rider Analysis */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Route className="h-5 w-5 text-blue-500" />
                Rider Routes
              </h3>
              
              <ScrollArea className="h-96 border rounded-lg">
                <div className="p-4 space-y-3">
                  {riders.map((rider) => {
                    const hasGoogleRoute = riderRoutes.has(rider.id);
                    const hasDbRoute = orders.some(order => 
                      order.rider?.id === rider.id && order.order.routeData?.geojson
                    );
                    const dbRouteData = databaseRoutes.get(rider.id);
                    
                    return (
                      <div key={rider.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm">{rider.name}</div>
                          <div className="flex gap-1">
                            {hasGoogleRoute && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                Google
                              </Badge>
                            )}
                            {hasDbRoute && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">
                                <Database className="h-3 w-3 mr-1" />
                                DB
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Status: {rider.status}</div>
                          <div>Orders: {rider.currentOrders.length}</div>
                          <div>Position: [{rider.position.lng.toFixed(5)}, {rider.position.lat.toFixed(5)}]</div>
                          
                          {dbRouteData && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-purple-600">
                                DB Route: {dbRouteData.distance.toFixed(1)}km • {Math.round(dbRouteData.duration/60)}min
                                <br />Points: {dbRouteData.coordinates?.length || 0}
                              </div>
                            </div>
                          )}
                          
                          {riderRoutes.has(rider.id) && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-blue-600">
                                Google Route: {riderRoutes.get(rider.id).distance.toFixed(1)}km • {Math.round(riderRoutes.get(rider.id).duration/60)}min
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex gap-4">
              <Button
                size="sm"
                onClick={() => {
                  console.log('=== ROUTE DEBUG DATA ===');
                  console.log('Orders with routes:', ordersWithRouteData);
                  console.log('Rider routes (Google):', Array.from(riderRoutes.entries()));
                  console.log('Database routes:', Array.from(databaseRoutes.entries()));
                  console.log('Raw orders:', orders);
                  console.log('Riders:', riders);
                }}
              >
                Log Debug Data
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const sampleOrder = ordersWithRouteData[0];
                  if (sampleOrder) {
                    console.log('Sample route GeoJSON:', sampleOrder.order.routeData.geojson);
                    console.log('Parsed:', JSON.parse(sampleOrder.order.routeData.geojson));
                  }
                }}
                disabled={ordersWithRouteData.length === 0}
              >
                Log Sample Route
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}