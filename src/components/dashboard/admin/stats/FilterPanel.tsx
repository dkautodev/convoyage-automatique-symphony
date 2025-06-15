
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";
import { VEHICLE_CATEGORIES, CATEGORY_LABELS } from "@/types/advancedStats";

export const FilterPanel: React.FC = () => {
  const { filters, updateFilters, resetFilters } = useFilters();

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    updateFilters({ categories: newCategories });
  };

  const removeCategoryFilter = (category: string) => {
    updateFilters({
      categories: filters.categories.filter(c => c !== category)
    });
  };

  const hasActiveFilters = filters.categories.length > 0;

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtres
        </CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4" />
            Effacer
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Filtres actifs :</div>
            <div className="flex flex-wrap gap-1">
              {filters.categories.map(category => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => removeCategoryFilter(category)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Period Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Période</label>
          <Select
            value={filters.period}
            onValueChange={(value: 'month' | 'quarter' | 'year') => 
              updateFilters({ period: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mensuel</SelectItem>
              <SelectItem value="quarter">Trimestriel</SelectItem>
              <SelectItem value="year">Annuel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Catégories de véhicules</label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {VEHICLE_CATEGORIES.map(category => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={(checked) => 
                    handleCategoryToggle(category, !!checked)
                  }
                />
                <label 
                  htmlFor={category} 
                  className="text-xs cursor-pointer"
                >
                  {CATEGORY_LABELS[category]}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
