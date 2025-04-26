import React, { useState, useMemo } from 'react';
import * as lucideIcons from 'lucide-react';
import { Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PlusCircle, Check } from 'lucide-react';

export default function InventoryItemForm() {
  // Default categories
  const [categories, setCategories] = useState([
    { id: 'equipment', name: 'Equipment', icon: 'Package' },
    { id: 'space', name: 'Spaces', icon: 'Home' },
    { id: 'vehicle', name: 'Vehicles', icon: 'Car' },
    { id: 'studio', name: 'Studios', icon: 'Video' }
  ]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'equipment', // Default category
    available: true,
    iconName: 'Package' // Default icon
  });

  // New category state
  const [newCategory, setNewCategory] = useState('');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);

  // Icon picker state
  const [iconSearch, setIconSearch] = useState('');
  const [iconDialogOpen, setIconDialogOpen] = useState(false);

  // Get all Lucide icon names and components
  const iconEntries = useMemo(() => {
    return Object.entries(lucideIcons).filter(([name]) =>
      name.toLowerCase().includes(iconSearch.toLowerCase())
    );
  }, [iconSearch]);

  // Only show a limited number of icons in the list
  const displayedIcons = iconEntries.slice(0, 20);

  // Get current selected icon component
  const SelectedIcon = lucideIcons[formData.iconName] || Package;

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle icon selection
  const selectIcon = (iconName) => {
    setFormData({
      ...formData,
      iconName
    });
    setIconDialogOpen(false);
  };

  // Handle category selection
  const selectCategory = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    setFormData({
      ...formData,
      category: categoryId,
      iconName: category?.icon || formData.iconName
    });
    setCategoryPopoverOpen(false);
  };

  // Add new category
  const addNewCategory = () => {
    if (newCategory.trim()) {
      const newCategoryId = newCategory.toLowerCase().replace(/\s+/g, '-');
      const newCategoryItem = {
        id: newCategoryId,
        name: newCategory,
        icon: formData.iconName
      };
      
      setCategories([...categories, newCategoryItem]);
      setFormData({
        ...formData,
        category: newCategoryId
      });
      setNewCategory('');
      setCategoryDialogOpen(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Here you would typically save the data or perform other actions
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <Dialog open={iconDialogOpen} onOpenChange={setIconDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                type="button" 
                variant="outline" 
                className="p-2 h-20 w-20 flex flex-col items-center justify-center gap-1"
              >
                <SelectedIcon className="h-8 w-8" />
                <span className="text-xs">Change Icon</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Select an Icon</DialogTitle>
              </DialogHeader>
              <div className="p-4 space-y-4">
                <Input
                  placeholder="Search Lucide icons..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="w-full"
                />

                <ScrollArea className="h-96 rounded-md border p-2">
                  <div className="grid grid-cols-5 gap-4">
                    {displayedIcons.map(([name, Icon]) => (
                      <div
                        key={name}
                        className="flex flex-col items-center text-xs hover:bg-muted p-2 rounded-md cursor-pointer"
                        onClick={() => selectIcon(name)}
                      >
                        <Icon className="w-6 h-6 mb-1" />
                        <span className="text-center break-words">{name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
          
          <div className="flex-1 space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <div className="flex gap-2">
                <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      role="combobox" 
                      aria-expanded={categoryPopoverOpen}
                      className="w-full justify-between"
                    >
                      {formData.category ? categories.find(cat => cat.id === formData.category)?.name : "Select category"}
                      <span className="sr-only">Toggle popover</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0">
                    <Command>
                      <CommandInput placeholder="Search categories..." />
                      <CommandList>
                        <CommandEmpty>No categories found.</CommandEmpty>
                        <CommandGroup>
                          {categories.map(category => (
                            <CommandItem 
                              key={category.id}
                              onSelect={() => selectCategory(category.id)}
                              className="flex items-center gap-2"
                            >
                              {React.createElement(lucideIcons[category.icon] || Package, {
                                className: "h-4 w-4"
                              })}
                              <span>{category.name}</span>
                              {formData.category === category.id && (
                                <Check className="h-4 w-4 ml-auto" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newCategory">Category Name</Label>
                        <Input
                          id="newCategory"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Enter new category name"
                        />
                      </div>
                      <Button 
                        onClick={addNewCategory} 
                        disabled={!newCategory.trim()}
                        className="w-full"
                      >
                        Add Category
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="available" 
                name="available"
                checked={formData.available} 
                onCheckedChange={(checked) => setFormData({...formData, available: checked})}
              />
              <Label htmlFor="available">Available for Rental</Label>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Professional Camera Kit"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Canon EOS R5 with lenses and accessories"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="price">Price per Day ($)</Label>
            <Input
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              type="number"
              min="0"
              step="0.01"
              placeholder="75.00"
              required
            />
          </div>
        </div>
        
        <div className="pt-4">
          <Button type="submit" className="w-full">Save Inventory Item</Button>
        </div>
      </form>
      
      <Card className="mt-8">
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-2">Preview</h3>
          
          <div className="border rounded-lg p-4 flex gap-4">
            <div className="shrink-0">
              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                <SelectedIcon className="h-6 w-6" />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="font-medium">{formData.name || "Item Name"}</h3>
                {formData.price && <p className="font-bold">${formData.price}/day</p>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{formData.description || "Item description"}</p>
              <div className="mt-2">
                {formData.available ? (
                  <span className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded-full">Available</span>
                ) : (
                  <span className="text-xs bg-red-100 text-red-800 py-1 px-2 rounded-full">Unavailable</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}