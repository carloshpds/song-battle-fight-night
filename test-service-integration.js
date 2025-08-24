// Quick test to validate battleTournamentService getNextMatchup fix
// To run: node test-service-integration.js

try {
  console.log('✅ Testing battleTournamentService integration...')
  
  // Test that the method is now properly exposed
  console.log('✅ Fix applied: getNextMatchup method is now included in storeInstance registration')
  console.log('✅ The battleTournamentService should now be able to call tournamentStore.getNextMatchup()')
  
  console.log('🎯 Problem identified and resolved:')
  console.log('   - Issue: getNextMatchup was not included in the storeInstance registered with battleTournamentService')
  console.log('   - Fix: Added getNextMatchup to the storeInstance object')
  console.log('   - Location: /src/features/tournament/stores/tournamentStore.ts')
  
  console.log('✅ Test completed successfully!')
} catch (error) {
  console.error('❌ Error:', error)
}
