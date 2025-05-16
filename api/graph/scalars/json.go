package graph

import (
	"encoding/json"
	"fmt"
	"io"

	"github.com/99designs/gqlgen/graphql"
)

func MarshalJSON(j map[string]interface{}) graphql.Marshaler {
	return graphql.WriterFunc(func(w io.Writer) {
		_ = json.NewEncoder(w).Encode(j)
	})
}

func UnmarshalJSON(v interface{}) (map[string]interface{}, error) {
	if val, ok := v.(map[string]interface{}); ok {
		return val, nil
	}
	return nil, fmt.Errorf("unexpected type for JSON: %T", v)
}
