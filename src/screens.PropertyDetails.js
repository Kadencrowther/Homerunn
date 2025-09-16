<View style={styles.detailsGrid}>
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>Property Type</Text>
    <Text style={styles.detailValue}>{formatValue(mappedProperty.propertyType)}</Text>
  </View>
  
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>Property Subtype</Text>
    <Text style={styles.detailValue}>{formatValue(mappedProperty.propertySubType)}</Text>
  </View>
  
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>Lot Size</Text>
    <Text style={styles.detailValue}>{formatValue(mappedProperty.lotSize, ' sq ft')}</Text>
  </View>
  
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>List Date</Text>
    <Text style={styles.detailValue}>
      {formatDate(mappedProperty.listingContractDate)}
    </Text>
  </View>
  
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>Days on Market</Text>
    <Text style={styles.detailValue}>{calculateDaysOnMarket()}</Text>
  </View>
  
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>MLS #</Text>
    <Text style={styles.detailValue}>{formatValue(mappedProperty.mlsNumber)}</Text>
  </View>
  
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>Listing Office</Text>
    <Text style={styles.detailValue}>{formatValue(mappedProperty.listingOffice)}</Text>
  </View>
</View> 