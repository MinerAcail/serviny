import React, { useState } from "react";
import { Check, Plus, Trash, Save, Edit } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useParams } from "react-router";
import { toast } from "sonner";
import { ghSim } from "@/components/custom/ItemGrid";
import { Textarea } from "@/components/ui/textarea";

// GraphQL queries and mutations
export const GET_PRICE_CARDS = gql`
  query GetPriceCards($serviceId: String) {
    getpriceCardsinformation(serviceId: $serviceId) {
      card {
        id
        title
        description
      }
      prices {
        id
        label
        value
      }
      amenities {
        id
        text
      }
    }
  }
`;

const CREATE_PRICE_CARD = gql`
  mutation CreatePriceCard($input: PriceCardInput!) {
    createPriceCard(input: $input) {
      card {
        id
        title
        description
      }
      prices {
        id
        label
        value
      }
      amenities {
        id
        text
      }
    }
  }
`;

const UPDATE_PRICE_CARD = gql`
  mutation UpdatePriceCard($input: UpdatePriceCardInput!, $priceCardId: String) {
    updatePriceCard(input: $input, priceCardId: $priceCardId) {
      id
      title
      description
    }
  }
`;

const DELETE_PRICE_CARD = gql`
  mutation DeletePriceCard($priceCardId: String!) {
    deletePriceCard(priceCardId: $priceCardId)
  }
`;

// Types based on GraphQL schema
interface Price {
  id: string;
  label: string;
  value: string;
  priceCardId?: string;
}

interface Amenity {
  id: string;
  text: string;
  priceCardId?: string;
}

interface PriceCard {
  id: string;
  title: string;
  description: string;
  ServiceId?: string;
}

interface FullCard {
  card: PriceCard;
  prices: Price[];
  amenities: Amenity[];
}

interface PriceInput {
  label: string;
  value: string;
}

interface AmenityInput {
  text: string;
}

interface PriceCardInput {
  title: string;
  description: string;
  badge?: string;
  prices: PriceInput[];
  amenities: AmenityInput[];
}

// Component for individual form fields
const FormField: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, id, value, onChange, placeholder }) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mb-2"
    />
  </div>
);
const FormFieldTextarea: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, id, value, onChange, placeholder }) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mb-2"
    />
  </div>
);
// Price Input Component
const PriceInput: React.FC<{
  label: string;
  value: string;
  onLabelChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}> = ({ label, value, onLabelChange, onValueChange, onRemove, canRemove }) => (
  <div className="flex justify-between items-center">
    <Input
      value={label}
      onChange={(e) => onLabelChange(e.target.value)}
      className="w-1/2 mr-2 text-sm"
    />
    <div className="flex items-center">
      <span className="mr-1">{ghSim}</span>
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-16 text-right font-medium"
      />
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onRemove}
        className="ml-1 p-0 h-8 w-8"
        disabled={!canRemove}
      >
        <Trash className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  </div>
);

// Amenity Input Component
const AmenityInput: React.FC<{
  text: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}> = ({ text, onChange, onRemove, canRemove }) => (
  <li className="flex items-center">
    <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
    <Textarea
      // type=""
      value={text}
      onChange={(e) => onChange(e.target.value)}
      className="flex-grow text-sm"
    />
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onRemove}
      className="ml-1 p-0 h-8 w-8"
      disabled={!canRemove}
    >
      <Trash className="h-4 w-4 text-red-500" />
    </Button>
  </li>
);

// Individual Price Card Component
const PriceCardItem: React.FC<{
  fullCard: FullCard;
  onEdit: (card: FullCard) => void;
}> = ({ fullCard, onEdit }) => (
  <Card className="h-full flex flex-col">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <CardTitle>{fullCard.card.title}</CardTitle>
          <CardDescription>{fullCard.card.description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    
    <CardContent className="space-y-4 flex-grow">
      {/* Prices */}
      <div className="space-y-2">
        {fullCard.prices.map((price) => (
          <div key={price.id} className="flex justify-between items-center">
            <span className="text-sm">{price.label}</span>
            <span className="font-medium">{ghSim}{price.value}</span>
          </div>
        ))}
      </div>
      
      {/* Amenities */}
      <div className="pt-2 border-t">
  <Label className="mb-2 block">Amenities</Label>
  <ul className="text-sm space-y-2">
    {fullCard.amenities.map((amenity) => (
      <li key={amenity.id} className="flex items-start space-x-2">
        <div className="pt-[2px]">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
        </div>
        <span className="break-words">{amenity.text}</span>
      </li>
    ))}
  </ul>
</div>


    </CardContent>
    
    <CardFooter className="mt-auto">
      <Button 
        onClick={() => onEdit(fullCard)} 
        className="w-full flex items-center justify-center gap-1"
      >
        <Edit className="h-4 w-4" /> Edit Card
      </Button>
    </CardFooter>
  </Card>
);

// New Card Form Component
const NewCardForm: React.FC<{
  formData: PriceCardInput;
  updateField: (field: keyof PriceCardInput, value: string | PriceInput[] | AmenityInput[] | undefined) => void;
  addPrice: () => void;
  updatePrice: (index: number, field: keyof PriceInput, value: string) => void;
  removePrice: (index: number) => void;
  addAmenity: () => void;
  updateAmenity: (index: number, value: string) => void;
  removeAmenity: (index: number) => void;
}> = ({ 
  formData, 
  updateField, 
  addPrice, 
  updatePrice, 
  removePrice, 
  addAmenity, 
  updateAmenity, 
  removeAmenity 
}) => (
  <div className="space-y-4 py-4">
    {/* Card Details */}
    <div className="space-y-3">
      <FormField
        label="Title"
        id="new-title"
        value={formData.title}
        onChange={(value) => updateField("title", value)}
        placeholder="Type"
      />
      
      <FormFieldTextarea
        label="Description"
        id="new-desc"
        value={formData.description}
        onChange={(value) => updateField("description", value)}
        placeholder="Description here"
      />
    </div>
    
    {/* Prices */}
    <div>
      <Label className="mb-2 block">Prices</Label>
      <div className="space-y-2">
        {formData.prices.map((price, index) => (
          <PriceInput
            key={index}
            label={price.label}
            value={price.value}
            onLabelChange={(value) => updatePrice(index, "label", value)}
            onValueChange={(value) => updatePrice(index, "value", value)}
            onRemove={() => removePrice(index)}
            canRemove={formData.prices.length > 1}
          />
        ))}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addPrice}
          className="mt-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Add Price
        </Button>
      </div>
    </div>
    
    {/* Amenities */}
    <div>
      <Label className="mb-2 block">Amenities</Label>
      <ul className="space-y-2">
        {formData.amenities.map((amenity, index) => (
          <AmenityInput
            key={index}
            text={amenity.text}
            onChange={(value) => updateAmenity(index, value)}
            onRemove={() => removeAmenity(index)}
            canRemove={formData.amenities.length > 1}
          />
        ))}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addAmenity}
          className="mt-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Add Amenity
        </Button>
      </ul>
    </div>
  </div>
);

const Price: React.FC = () => {
  // Get serviceId from props or context if needed
  const { serviceId } = useParams<{ serviceId: string }>();

  // Apollo query to fetch price cards
  const { loading, error, data, refetch } = useQuery(GET_PRICE_CARDS, {
    variables: { serviceId },
  });

  // Apollo mutations
  const [createPriceCard] = useMutation(CREATE_PRICE_CARD, {
    onCompleted: () => refetch(),
  });
  
  const [updatePriceCard] = useMutation(UPDATE_PRICE_CARD, {
    onCompleted: () => refetch(),
  });
  
  const [deletePriceCard] = useMutation(DELETE_PRICE_CARD, {
    onCompleted: () => refetch(),
  });

  // State for dialogs
  const [newCardDialogOpen, setNewCardDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FullCard | null>(null);
  
  // State for new card form
  const [newCardData, setNewCardData] = useState<PriceCardInput>({
    title: "",
    description: "",
    prices: [{ label: "Price:", value: "0" }],
    amenities: [{ text: "Amenity" }]
  });

  // Get cards from query data
  const cards: FullCard[] = data?.getpriceCardsinformation || [];

  // Edit card - open dialog with card data
  const editCard = (card: FullCard) => {
    setEditingCard({ ...card });
    setEditDialogOpen(true);
  };

  const addCard = () => {
    createPriceCard({
      variables: {
        input: newCardData,
      },
      onCompleted: () => {
        toast.success("Price card created successfully!");
        refetch();
      },
      onError: (error) => {
        toast.error(`Failed to create price card: ${error.message}`);
      },
    });
  
    // Reset form
    setNewCardData({
      title: "",
      description: "",
      prices: [{ label: "Price:", value: "0" }],
      amenities: [{ text: "Amenity" }],
    });
    setNewCardDialogOpen(false);
  };

  // Save edited card
  const saveCard = () => {
    if (!editingCard) return;
  
    const { card, prices, amenities } = editingCard;
  
    updatePriceCard({
      variables: {
        priceCardId: card.id,
        input: {
          title: card.title,
          description: card.description,
          prices: prices.map((p) => ({ label: p.label, value: p.value })),
          amenities: amenities.map((a) => ({ text: a.text })),
        },
      },
      onCompleted: () => {
        toast.success("Price card updated successfully!");
        refetch();
      },
      onError: (error) => {
        toast.error(`Failed to update price card: ${error.message}`);
      },
    });
  
    setEditDialogOpen(false);
    setEditingCard(null);
  };

  // Remove card
  const removeCard = (cardId: string) => {
    deletePriceCard({
      variables: {
        priceCardId: cardId,
      },
      onCompleted: () => {
        toast.success("Price card deleted successfully!");
        refetch();
      },
      onError: (error) => {
        toast.error(`Failed to delete price card: ${error.message}`);
      },
    });
  
    if (editingCard && editingCard.card.id === cardId) {
      setEditDialogOpen(false);
      setEditingCard(null);
    }
  };

  // Form handlers for new card
  const updateNewCardField = (field: keyof PriceCardInput, value: string | PriceInput[] | AmenityInput[] | undefined) => {
    setNewCardData({ ...newCardData, [field]: value });
  };

  const addNewCardPrice = () => {
    updateNewCardField("prices", [
      ...newCardData.prices,
      { label: "New Price:", value: "0" }
    ]);
  };

  const updateNewCardPrice = (index: number, field: keyof PriceInput, value: string) => {
    const updatedPrices = [...newCardData.prices];
    updatedPrices[index] = { ...updatedPrices[index], [field]: value };
    updateNewCardField("prices", updatedPrices);
  };

  const removeNewCardPrice = (index: number) => {
    const updatedPrices = newCardData.prices.filter((_, i) => i !== index);
    updateNewCardField("prices", updatedPrices);
  };

  const addNewCardAmenity = () => {
    updateNewCardField("amenities", [
      ...newCardData.amenities,
      { text: "New Amenity" }
    ]);
  };

  const updateNewCardAmenity = (index: number, value: string) => {
    const updatedAmenities = [...newCardData.amenities];
    updatedAmenities[index] = { ...updatedAmenities[index], text: value };
    updateNewCardField("amenities", updatedAmenities);
  };

  const removeNewCardAmenity = (index: number) => {
    const updatedAmenities = newCardData.amenities.filter((_, i) => i !== index);
    updateNewCardField("amenities", updatedAmenities);
  };

  // Form handlers for editing card
  const updateEditingCardField = (field: keyof FullCard, value: FullCard[keyof FullCard]) => {
    if (!editingCard) return;
    setEditingCard({ ...editingCard, [field]: value });
  };

  const updateEditingCardProperty = (field: keyof PriceCard, value: string) => {
    if (!editingCard) return;
    const updatedCard = { ...editingCard.card, [field]: value };
    updateEditingCardField("card", updatedCard);
  };

  const addEditingCardPrice = () => {
    if (!editingCard) return;
    
    // Generate temporary ID for UI purposes
    const tempId = `temp-${Date.now()}`;
    
    updateEditingCardField("prices", [
      ...editingCard.prices,
      { id: tempId, label: "New Price:", value: "0" }
    ]);
  };

  const updateEditingCardPrice = (priceId: string, field: keyof Price, value: string) => {
    if (!editingCard) return;

    const updatedPrices = editingCard.prices.map(price => 
      price.id === priceId ? { ...price, [field]: value } : price
    );
    updateEditingCardField("prices", updatedPrices);
  };

  const removeEditingCardPrice = (priceId: string) => {
    if (!editingCard) return;

    const updatedPrices = editingCard.prices.filter(price => price.id !== priceId);
    updateEditingCardField("prices", updatedPrices);
  };

  const addEditingCardAmenity = () => {
    if (!editingCard) return;

    // Generate temporary ID for UI purposes
    const tempId = `temp-${Date.now()}`;
    
    updateEditingCardField("amenities", [
      ...editingCard.amenities,
      { id: tempId, text: "New Amenity" }
    ]);
  };

  const updateEditingCardAmenity = (amenityId: string, value: string) => {
    if (!editingCard) return;

    const updatedAmenities = editingCard.amenities.map(amenity => 
      amenity.id === amenityId ? { ...amenity, text: value } : amenity
    );
    updateEditingCardField("amenities", updatedAmenities);
  };

  const removeEditingCardAmenity = (amenityId: string) => {
    if (!editingCard) return;

    const updatedAmenities = editingCard.amenities.filter(amenity => amenity.id !== amenityId);
    updateEditingCardField("amenities", updatedAmenities);
  };

  // Handle loading and error states
  if (loading) return <div>Loading price cards...</div>;
  if (error) return <div>Error loading price cards: {error.message}</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        {/* Add New Card Dialog Trigger */}
        <Dialog open={newCardDialogOpen} onOpenChange={setNewCardDialogOpen}>
          <DialogTrigger className="" asChild>
            <Button className="flex items-center justify-end gap-1">
              <Plus className="h-4 w-4" />New Price
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90%] overflow-y-auto">

            <DialogHeader>
              <DialogTitle>Create New Card</DialogTitle>
              <DialogDescription>Fill in the details for your new rate card</DialogDescription>
            </DialogHeader>
            
            <NewCardForm
              formData={newCardData}
              updateField={updateNewCardField}
              addPrice={addNewCardPrice}
              updatePrice={updateNewCardPrice}
              removePrice={removeNewCardPrice}
              addAmenity={addNewCardAmenity}
              updateAmenity={updateNewCardAmenity}
              removeAmenity={removeNewCardAmenity}
            />
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewCardDialogOpen(false)}>Cancel</Button>
              <Button onClick={addCard}>Create Card</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Edit Card Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90%] overflow-y-auto">

          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
            <DialogDescription>Update details for this type</DialogDescription>
          </DialogHeader>
          
          {editingCard && (
            <div className="space-y-4 py-4">
              {/* Card Details */}
              <div className="space-y-3">
                <FormField
                  label="Title"
                  id="edit-title"
                  value={editingCard.card.title}
                  onChange={(value) => updateEditingCardProperty("title", value)}
                />
                
                <FormFieldTextarea
                  label="Description"
                  id="edit-desc"
                  value={editingCard.card.description}
                  onChange={(value) => updateEditingCardProperty("description", value)}
                />
              </div>
              
              {/* Prices */}
              <div>
                <Label className="mb-2 block">Prices</Label>
                <div className="space-y-2">
                  {editingCard.prices.map((price) => (
                    <PriceInput
                      key={price.id}
                      label={price.label}
                      value={price.value}
                      onLabelChange={(value) => updateEditingCardPrice(price.id, "label", value)}
                      onValueChange={(value) => updateEditingCardPrice(price.id, "value", value)}
                      onRemove={() => removeEditingCardPrice(price.id)}
                      canRemove={editingCard.prices.length > 1}
                    />
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addEditingCardPrice}
                    className="mt-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Price
                  </Button>
                </div>
              </div>
              
              {/* Amenities */}
              <div>
                <Label className="mb-2 block">Amenities</Label>
                <ul className="space-y-2">
                  {editingCard.amenities.map((amenity) => (
                    <AmenityInput
                      key={amenity.id}
                      text={amenity.text}
                      onChange={(value) => updateEditingCardAmenity(amenity.id, value)}
                      onRemove={() => removeEditingCardAmenity(amenity.id)}
                      canRemove={editingCard.amenities.length > 1}
                    />
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addEditingCardAmenity}
                    className="mt-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Amenity
                  </Button>
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between sm:justify-end">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (editingCard) removeCard(editingCard.card.id);
              }}
              className="mr-auto"
            >
              <Trash className="h-4 w-4 mr-1" /> Delete
            </Button>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCard}>
              <Save className="h-4 w-4 mr-1" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Masonry-style grid for cards with varying heights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
        {cards.map((fullCard) => (
          <div key={fullCard.card.id} className="h-full">
            <PriceCardItem fullCard={fullCard} onEdit={editCard} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Price;