import pandas as pd
import os

# Load the CSV file with the specified encoding
df = pd.read_csv("Global YouTube Statistics.csv", encoding='ISO-8859-1')

# Select the required columns
columns_to_keep = ['rank', 'subscribers', 'Title', 'category', 'video views', 'highest_yearly_earnings', 'Country']
processed_df = df[columns_to_keep]

# Print the number of rows before filtering
rows_before = processed_df.shape[0]
print(f"Number of rows before filtering: {rows_before}")

# Drop rows with specified conditions
filtered_df = processed_df[
    (processed_df['video views'] > 0) &
    (processed_df['highest_yearly_earnings'] > 0) &
    (processed_df['category'].notna()) & (processed_df['category'] != '') &
    (processed_df['Country'].notna()) & (processed_df['Country'] != '')
]

# Clean the 'Title' column by removing unwanted characters
filtered_df['Title'] = filtered_df['Title'].str.replace(r'\[.*?\]', '', regex=True)  # Remove anything in brackets
filtered_df['Title'] = filtered_df['Title'].str.replace(r'[Ã¯Â¿Â½]', '', regex=True)  # Remove specific unwanted characters
filtered_df['Title'] = filtered_df['Title'].str.strip()  # Strip whitespace from the ends

# Drop rows where Title consists only of unwanted characters (like Ã½)
filtered_df = filtered_df[~filtered_df['Title'].str.contains(r'^[Ã½]+$', regex=True)]

# Replace "United States" with "United States of America" in the 'Country' column
filtered_df['Country'] = filtered_df['Country'].replace("United States", "United States of America")

# Print the number of rows after filtering
rows_after = filtered_df.shape[0]
print(f"Number of rows after filtering: {rows_after}")

# Create a new folder named 'data' if it doesn't exist
output_folder = 'data'
os.makedirs(output_folder, exist_ok=True)

# Save the filtered DataFrame to a new CSV file
output_file = os.path.join(output_folder, 'data.csv')
filtered_df.to_csv(output_file, index=False)

print(f"Processed data saved to {output_file}")
