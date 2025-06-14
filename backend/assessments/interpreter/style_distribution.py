"""
StyleDistribution class for handling multimodal learning style distributions
"""

class StyleDistribution:
    """Helper class to handle distributed learning style values."""
    def __init__(self, distribution):
        """
        Initialize with a distribution of learning styles
        
        Args:
            distribution: Dict or String - Either a dict mapping styles to weights,
                        or a single style string (which will get 100% weight)
        """
        if isinstance(distribution, dict):
            self.distribution = distribution
            self._normalize()
        else:
            # Handle single string value (e.g., "Visual")
            self.distribution = {distribution: 1.0}
    
    def _normalize(self):
        """Ensure all weights sum to 1.0"""
        total = sum(self.distribution.values())
        if total > 0:
            self.distribution = {style: weight/total for style, weight in self.distribution.items()}
    
    def get_weight(self, style):
        """Get the weight for a specific style"""
        return self.distribution.get(style, 0.0)
    
    def get_styles(self):
        """Get all styles with non-zero weights"""
        return [style for style, weight in self.distribution.items() if weight > 0]
    
    def get_distribution(self):
        """Get the full distribution dictionary"""
        return self.distribution
    
    def is_multimodal(self):
        """Check if this represents multiple styles"""
        return len(self.get_styles()) > 1
    
    def primary_style(self):
        """Get the primary (highest weight) style"""
        if not self.distribution:
            return None
        return max(self.distribution.items(), key=lambda x: x[1])[0]
    
    def secondary_style(self):
        """Get the secondary (second highest weight) style if exists"""
        if len(self.distribution) < 2:
            return None
        
        sorted_styles = sorted(self.distribution.items(), key=lambda x: x[1], reverse=True)
        return sorted_styles[1][0]
    
    def similarity_score(self, other):
        """
        Calculate similarity score with another StyleDistribution
        
        Args:
            other: StyleDistribution - The distribution to compare with
            
        Returns:
            float - Similarity score from 0-1 (higher means more similar)
        """
        if not isinstance(other, StyleDistribution):
            return 0.0
            
        # Get all unique styles from both distributions
        all_styles = set(self.get_styles()) | set(other.get_styles())
        
        # Sum the absolute differences for each style
        diff_sum = 0
        for style in all_styles:
            diff_sum += abs(self.get_weight(style) - other.get_weight(style))
            
        # Normalize to a similarity score (0-1)
        # For N styles, maximum difference is 2 for completely different distributions
        max_diff = min(2, len(all_styles))
        similarity = 1 - (diff_sum / max_diff)
        
        return similarity 